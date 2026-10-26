export interface SpeechSegment {
  channel: 0 | 1; // 0 = Interviewer (Loopback), 1 = Candidate (Mic)
  audio: Float32Array; // 16kHz normalized mono Float32 audio (-1.0 to 1.0)
  durationMs: number;
  timestamp: number;
}

export type SpeechSegmentCallback = (segment: SpeechSegment) => void;

export class VADChunker {
  private sampleRate: number = 16000;
  private speechThreshold: number = 0.005; // Sensitive to real speech & video audio
  private silenceFramesLimit: number = 8; // ~400ms of silence marks end of utterance
  private maxUtteranceSamples: number = 16000 * 12; // Max 12s per chunk

  // State for Channel 0 (Interviewer)
  private ch0Accumulator: number[] = [];
  private ch0SilenceFrames: number = 0;
  private ch0IsSpeaking: boolean = false;

  // State for Channel 1 (Candidate)
  private ch1Accumulator: number[] = [];
  private ch1SilenceFrames: number = 0;
  private ch1IsSpeaking: boolean = false;

  private onSpeechSegmentCallbacks: SpeechSegmentCallback[] = [];

  constructor(sampleRate: number = 16000, speechThreshold: number = 0.005) {
    this.sampleRate = sampleRate;
    this.speechThreshold = speechThreshold;
  }

  public onSpeechSegment(callback: SpeechSegmentCallback): () => void {
    this.onSpeechSegmentCallbacks.push(callback);
    return () => {
      this.onSpeechSegmentCallbacks = this.onSpeechSegmentCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Process raw stereo interleaved 16-bit PCM buffer from AudioMultiplexer
   */
  public processStereoPCM(pcmBuffer: ArrayBuffer): void {
    const int16 = new Int16Array(pcmBuffer);
    const frameCount = int16.length / 2;

    const ch0Samples: number[] = new Array(frameCount);
    const ch1Samples: number[] = new Array(frameCount);

    let ch0SumSq = 0;
    let ch1SumSq = 0;

    for (let i = 0; i < frameCount; i++) {
      const s0 = int16[i * 2] / 32768.0;
      const s1 = int16[i * 2 + 1] / 32768.0;

      ch0Samples[i] = s0;
      ch1Samples[i] = s1;

      ch0SumSq += s0 * s0;
      ch1SumSq += s1 * s1;
    }

    const ch0Rms = Math.sqrt(ch0SumSq / (frameCount || 1));
    const ch1Rms = Math.sqrt(ch1SumSq / (frameCount || 1));

    // Process Channel 0 (Interviewer)
    this.processChannelFrame(0, ch0Samples, ch0Rms);

    // Process Channel 1 (Candidate)
    this.processChannelFrame(1, ch1Samples, ch1Rms);
  }

  private processChannelFrame(channel: 0 | 1, samples: number[], rms: number): void {
    // Channel 0 (Interviewer loopback): 0.005
    // Channel 1 (Candidate mic): 0.002 for high sensitivity to natural/quiet microphone speech
    const threshold = channel === 0 ? this.speechThreshold : 0.002;
    const isSpeaking = rms >= threshold;

    if (channel === 0) {
      if (isSpeaking) {
        this.ch0IsSpeaking = true;
        this.ch0SilenceFrames = 0;
        this.ch0Accumulator.push(...samples);
      } else if (this.ch0IsSpeaking) {
        this.ch0Accumulator.push(...samples);
        this.ch0SilenceFrames++;

        if (
          this.ch0SilenceFrames >= this.silenceFramesLimit ||
          this.ch0Accumulator.length >= this.maxUtteranceSamples
        ) {
          this.flushSegment(0);
        }
      }
    } else {
      if (isSpeaking) {
        this.ch1IsSpeaking = true;
        this.ch1SilenceFrames = 0;
        this.ch1Accumulator.push(...samples);
      } else if (this.ch1IsSpeaking) {
        this.ch1Accumulator.push(...samples);
        this.ch1SilenceFrames++;

        if (
          this.ch1SilenceFrames >= this.silenceFramesLimit ||
          this.ch1Accumulator.length >= this.maxUtteranceSamples
        ) {
          this.flushSegment(1);
        }
      }
    }
  }

  private flushSegment(channel: 0 | 1): void {
    const rawSamples = channel === 0 ? this.ch0Accumulator : this.ch1Accumulator;

    // Minimum 300ms of audio required (~4800 samples at 16kHz)
    if (rawSamples.length >= 4800) {
      const float32 = new Float32Array(rawSamples);
      const durationMs = Math.round((rawSamples.length / this.sampleRate) * 1000);

      const segment: SpeechSegment = {
        channel,
        audio: float32,
        durationMs,
        timestamp: Date.now(),
      };

      for (const cb of this.onSpeechSegmentCallbacks) {
        try {
          cb(segment);
        } catch (e) {
          console.error('[VADChunker] Callback error:', e);
        }
      }
    }

    if (channel === 0) {
      this.ch0Accumulator = [];
      this.ch0SilenceFrames = 0;
      this.ch0IsSpeaking = false;
    } else {
      this.ch1Accumulator = [];
      this.ch1SilenceFrames = 0;
      this.ch1IsSpeaking = false;
    }
  }

  public reset(): void {
    this.ch0Accumulator = [];
    this.ch0SilenceFrames = 0;
    this.ch0IsSpeaking = false;
    this.ch1Accumulator = [];
    this.ch1SilenceFrames = 0;
    this.ch1IsSpeaking = false;
  }
}

export const vadChunker = new VADChunker();
