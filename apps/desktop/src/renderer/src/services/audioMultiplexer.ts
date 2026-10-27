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
  private micSplitter: ChannelSplitterNode | null = null;
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
    // CRITICAL: Must use native hardware sampleRate (e.g. 48000Hz or 44100Hz on Windows)
    // Forcing { sampleRate: 16000 } on Windows causes getUserMedia MediaStreamAudioSourceNode
    // to drop all microphone packets due to WASAPI clock mismatch!
    this.audioContext = new AudioContextClass();

    if (this.audioContext.state !== 'running') {
      try {
        await this.audioContext.resume();
      } catch (resumeErr) {
        console.warn('[AudioMultiplexer] AudioContext resume warning:', resumeErr);
      }
    }

    const currentRate = this.audioContext.sampleRate;
    console.log(`[AudioMultiplexer] AudioContext started natively at ${currentRate}Hz`);

    this.loopbackSource = this.audioContext.createMediaStreamSource(loopbackStream);
    this.micSource = this.audioContext.createMediaStreamSource(micStream);

    // Pre-mix loopback to mono channel 0 (takes stereo L+R from YouTube/Zoom and mixes cleanly to 1 channel)
    this.loopbackMonoGain = this.audioContext.createGain();
    this.loopbackMonoGain.channelCount = 1;
    this.loopbackMonoGain.channelCountMode = 'explicit';
    this.loopbackSource.connect(this.loopbackMonoGain);

    // For microphone (Candidate):
    // CRITICAL: DO NOT use channelCountMode = 'explicit' on stereo laptop mic arrays (Intel Smart Sound)!
    // Differential mic arrays use antiphase cancellation on Lid microphones. Summing (L + R) produces 0.
    // Instead, extract Channel 0 (the primary voice capsule) with ChannelSplitterNode.
    this.micSplitter = this.audioContext.createChannelSplitter(2);
    this.micSource.connect(this.micSplitter);

    this.micMonoGain = this.audioContext.createGain();
    this.micMonoGain.gain.value = 3.5; // 3.5x amplification boost for loud & clear candidate speech
    this.micSplitter.connect(this.micMonoGain, 0, 0); // Connect output 0 (Channel 0) to micMonoGain

    // 2-channel merger node:
    // Input 0 -> Channel 0 (Left: Interviewer/Loopback)
    // Input 1 -> Channel 1 (Right: Candidate/Microphone)
    this.mergerNode = this.audioContext.createChannelMerger(2);
    this.loopbackMonoGain.connect(this.mergerNode, 0, 0);
    this.micMonoGain.connect(this.mergerNode, 0, 1);

    // Buffer size 2048 samples (~43ms at 48kHz, ~128ms at 16kHz)
    const bufferSize = 2048;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 2, 2);

    let processCounter = 0;
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

      processCounter++;
      // Log diagnostic levels every ~3 seconds (~70 frames at bufferSize 2048 / 48kHz) or when candidate speaks
      if (rightRMS > 0.05 || (processCounter % 70 === 0 && (leftRMS > 0.01 || rightRMS > 0.01))) {
        console.log(`[AudioLevels] Interviewer VU: ${(leftRMS * 100).toFixed(1)}% | Candidate VU: ${(rightRMS * 100).toFixed(1)}%`);
      }

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

    if (this.micSplitter) {
      this.micSplitter.disconnect();
      this.micSplitter = null;
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

  public pause(): void {
    if (this.micMonoGain) {
      this.micMonoGain.gain.value = 0;
    }
  }

  public resume(): void {
    if (this.micMonoGain) {
      this.micMonoGain.gain.value = 3.5;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const audioMultiplexer = new AudioMultiplexer();
