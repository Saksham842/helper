import { AudioCaptureService } from './audioCapture';

export interface AudioLevels {
  interviewerLevel: number;
  candidateLevel: number;
}

export type AudioDataCallback = (pcmData: ArrayBuffer) => void;
export type AudioLevelsCallback = (levels: AudioLevels) => void;

function downsampleTo16k(input: Float32Array, inSampleRate: number): Float32Array {
  if (inSampleRate === 16000) return input;
  const ratio = inSampleRate / 16000;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i++) {
      accum += input[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export class AudioMultiplexer {
  private audioContext: AudioContext | null = null;
  private loopbackSource: MediaStreamAudioSourceNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private loopbackMonoGain: GainNode | null = null;
  private micMonoGain: GainNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private silentGainNode: GainNode | null = null;
  private isRunning: boolean = false;

  private onAudioDataCallbacks: AudioDataCallback[] = [];
  private onAudioLevelsCallbacks: AudioLevelsCallback[] = [];

  public onAudioData(callback: AudioDataCallback): () => void {
    this.onAudioDataCallbacks.push(callback);
    return () => {
      this.onAudioDataCallbacks = this.onAudioDataCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onAudioLevels(callback: AudioLevelsCallback): () => void {
    this.onAudioLevelsCallbacks.push(callback);
    return () => {
      this.onAudioLevelsCallbacks = this.onAudioLevelsCallbacks.filter((cb) => cb !== callback);
    };
  }

  public async start(loopbackStream: MediaStream, micStream: MediaStream): Promise<void> {
    if (this.isRunning) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    } catch {
      console.warn('[AudioMultiplexer] Explicit sampleRate: 16000 rejected, using default system sampleRate');
      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state !== 'running') {
      try {
        await this.audioContext.resume();
      } catch (resumeErr) {
        console.warn('[AudioMultiplexer] AudioContext resume warning:', resumeErr);
      }
    }

    const currentRate = this.audioContext.sampleRate;
    console.log(`[AudioMultiplexer] AudioContext started at sampleRate: ${currentRate}Hz`);

    this.loopbackSource = this.audioContext.createMediaStreamSource(loopbackStream);
    this.micSource = this.audioContext.createMediaStreamSource(micStream);

    // Pre-mix loopback to mono channel 0 (takes stereo L+R from YouTube and mixes cleanly to 1 channel)
    this.loopbackMonoGain = this.audioContext.createGain();
    this.loopbackMonoGain.channelCount = 1;
    this.loopbackMonoGain.channelCountMode = 'explicit';
    this.loopbackSource.connect(this.loopbackMonoGain);

    // Pre-mix mic to mono channel 1
    this.micMonoGain = this.audioContext.createGain();
    this.micMonoGain.channelCount = 1;
    this.micMonoGain.channelCountMode = 'explicit';
    this.micSource.connect(this.micMonoGain);

    // 2-channel merger node:
    // Input 0 -> Channel 0 (Left: Interviewer/Loopback)
    // Input 1 -> Channel 1 (Right: Candidate/Microphone)
    this.mergerNode = this.audioContext.createChannelMerger(2);
    this.loopbackMonoGain.connect(this.mergerNode, 0, 0);
    this.micMonoGain.connect(this.mergerNode, 0, 1);

    // Buffer size 2048 samples (~43ms at 48kHz, ~128ms at 16kHz)
    const bufferSize = 2048;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 2, 2);

    this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!this.isRunning) return;

      const leftChannelRaw = event.inputBuffer.getChannelData(0);  // Interviewer
      const rightChannelRaw = event.inputBuffer.getChannelData(1); // Candidate

      // Calculate audio levels for visual VU meter
      const leftRMS = AudioCaptureService.calculateRMS(leftChannelRaw);
      const rightRMS = AudioCaptureService.calculateRMS(rightChannelRaw);

      this.onAudioLevelsCallbacks.forEach((cb) =>
        cb({
          interviewerLevel: leftRMS,
          candidateLevel: rightRMS,
        })
      );

      // Downsample both channels to exact 16,000 Hz for Whisper VAD & STT
      const left16k = downsampleTo16k(leftChannelRaw, currentRate);
      const right16k = downsampleTo16k(rightChannelRaw, currentRate);

      const sampleCount = Math.min(left16k.length, right16k.length);
      const interleavedPCM = new Int16Array(sampleCount * 2);

      for (let i = 0; i < sampleCount; i++) {
        // Clamp float (-1.0 to 1.0) into signed 16-bit integer (-32768 to 32767)
        const leftSample = Math.max(-1, Math.min(1, left16k[i]));
        interleavedPCM[i * 2] = leftSample < 0 ? leftSample * 32768 : leftSample * 32767;

        const rightSample = Math.max(-1, Math.min(1, right16k[i]));
        interleavedPCM[i * 2 + 1] = rightSample < 0 ? rightSample * 32768 : rightSample * 32767;
      }

      const rawBuffer = interleavedPCM.buffer;
      this.onAudioDataCallbacks.forEach((cb) => cb(rawBuffer));
    };

    // Route through a zero-gain node to keep the processor pipeline active without echoing loopback audio into speakers
    this.silentGainNode = this.audioContext.createGain();
    this.silentGainNode.gain.value = 0;
    this.mergerNode.connect(this.processorNode);
    this.processorNode.connect(this.silentGainNode);
    this.silentGainNode.connect(this.audioContext.destination);

    // Prevent Chromium garbage-collection of audio graph nodes
    (window as any).__gp_processor = this.processorNode;
    (window as any).__gp_silentGain = this.silentGainNode;

    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
      delete (window as any).__gp_processor;
    }

    if (this.silentGainNode) {
      this.silentGainNode.disconnect();
      this.silentGainNode = null;
      delete (window as any).__gp_silentGain;
    }

    if (this.mergerNode) {
      this.mergerNode.disconnect();
      this.mergerNode = null;
    }

    if (this.loopbackMonoGain) {
      this.loopbackMonoGain.disconnect();
      this.loopbackMonoGain = null;
    }

    if (this.micMonoGain) {
      this.micMonoGain.disconnect();
      this.micMonoGain = null;
    }

    if (this.loopbackSource) {
      this.loopbackSource.disconnect();
      this.loopbackSource = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const audioMultiplexer = new AudioMultiplexer();
