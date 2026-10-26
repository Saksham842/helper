export interface AudioDevice {
  deviceId: string;
  label: string;
}

export class AudioCaptureService {
  private loopbackStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;

  public async getMicrophones(): Promise<AudioDevice[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone (${d.deviceId.slice(0, 5)}...)`,
        }));
    } catch (err) {
      console.error('Failed to enumerate audio devices:', err);
      return [];
    }
  }

  public async startLoopbackCapture(): Promise<MediaStream> {
    if (this.loopbackStream && this.loopbackStream.active) {
      return this.loopbackStream;
    }

    try {
      // Electron loopback audio capture via getDisplayMedia + session.setDisplayMediaRequestHandler
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });

      // Terminate video track immediately to preserve CPU/GPU memory
      displayStream.getVideoTracks().forEach((track) => track.stop());

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No system loopback audio track received from getDisplayMedia');
      }

      const audioOnlyStream = new MediaStream(audioTracks);
      this.loopbackStream = audioOnlyStream;
      return audioOnlyStream;
    } catch (err) {
      console.error('[AudioCapture] Failed to capture system loopback audio:', err);
      throw err;
    }
  }

  public async startMicrophoneCapture(deviceId?: string): Promise<MediaStream> {
    if (this.micStream && this.micStream.active) {
      return this.micStream;
    }

    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
      },
      video: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.micStream = stream;
    return stream;
  }

  public stopAll(): void {
    if (this.loopbackStream) {
      this.loopbackStream.getTracks().forEach((t) => t.stop());
      this.loopbackStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
  }

  public static calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / samples.length);
    // Normalize into 0.0 - 1.0 range
    return Math.min(1.0, rms * 5);
  }
}

export const audioCaptureService = new AudioCaptureService();
