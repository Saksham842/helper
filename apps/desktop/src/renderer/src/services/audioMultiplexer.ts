import { AudioCaptureService } from './audioCapture';

export interface AudioLevels {
  interviewerLevel: number;
  candidateLevel: number;
}

export type AudioDataCallback = (pcmData: ArrayBuffer) => void;
export type AudioLevelsCallback = (levels: AudioLevels) => void;

export class AudioMultiplexer {
  private audioContext: AudioContext | null = null;
  private loopbackSource: MediaStreamAudioSourceNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
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

    // Deepgram / Whisper optimal sample rate is 16,000 Hz
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    } catch {
      console.warn('[AudioMultiplexer] Explicit sampleRate: 16000 rejected by driver (e.g. Bluetooth AG), falling back to default sampleRate');
      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.loopbackSource = this.audioContext.createMediaStreamSource(loopbackStream);
    this.micSource = this.audioContext.createMediaStreamSource(micStream);

    // 2-channel merger node:
    // Input 0 -> Channel 0 (Left: Interviewer/Loopback)
    // Input 1 -> Channel 1 (Right: Candidate/Microphone)
    this.mergerNode = this.audioContext.createChannelMerger(2);

    this.loopbackSource.connect(this.mergerNode, 0, 0);
    this.micSource.connect(this.mergerNode, 0, 1);

    // Buffer size 2048 samples (~128ms at 16kHz)
    const bufferSize = 2048;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 2, 2);

    this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!this.isRunning) return;

      const leftChannel = event.inputBuffer.getChannelData(0);  // Interviewer
      const rightChannel = event.inputBuffer.getChannelData(1); // Candidate

      // Calculate audio levels for visual VU meter
      const leftRMS = AudioCaptureService.calculateRMS(leftChannel);
      const rightRMS = AudioCaptureService.calculateRMS(rightChannel);

      this.onAudioLevelsCallbacks.forEach((cb) =>
        cb({
          interviewerLevel: leftRMS,
          candidateLevel: rightRMS,
        })
      );

      // Convert and interleave Float32 samples into Linear16 PCM
      const sampleCount = leftChannel.length;
      const interleavedPCM = new Int16Array(sampleCount * 2);

      for (let i = 0; i < sampleCount; i++) {
        // Clamp float (-1.0 to 1.0) into signed 16-bit integer (-32768 to 32767)
        const leftSample = Math.max(-1, Math.min(1, leftChannel[i]));
        interleavedPCM[i * 2] = leftSample < 0 ? leftSample * 32768 : leftSample * 32767;

        const rightSample = Math.max(-1, Math.min(1, rightChannel[i]));
        interleavedPCM[i * 2 + 1] = rightSample < 0 ? rightSample * 32768 : rightSample * 32767;
      }

      const rawBuffer = interleavedPCM.buffer;
      this.onAudioDataCallbacks.forEach((cb) => cb(rawBuffer));
    };

    // Connect processor to destination to keep audio processing pipeline active
    this.mergerNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.mergerNode) {
      this.mergerNode.disconnect();
      this.mergerNode = null;
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
