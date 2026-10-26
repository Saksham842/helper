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
      const mics = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone (${d.deviceId.slice(0, 5)}...)`,
        }));
      console.log(`[AudioCapture] Enumerated ${mics.length} mic(s):`, mics.map((m) => `"${m.label}" (${m.deviceId.slice(0, 8)}...)`).join(', '));
      return mics;
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

      // DO NOT call track.stop() on video tracks!
      // In Chromium, stopping the video track terminates the entire desktop capture session, which destroys loopback audio!
      // Instead, set enabled = false to disable rendering and save 100% GPU/CPU while keeping the loopback audio stream alive.
      displayStream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No system loopback audio track received from getDisplayMedia');
      }

      this.loopbackStream = displayStream;
      return displayStream;
    } catch (err) {
      console.error('[AudioCapture] Failed to capture system loopback audio:', err);
      throw err;
    }
  }

  public async startMicrophoneCapture(deviceId?: string): Promise<MediaStream> {
    if (this.micStream && this.micStream.active) {
      if (!deviceId) return this.micStream;
      const currentTrack = this.micStream.getAudioTracks()[0];
      const settings = currentTrack?.getSettings();
      if (settings?.deviceId === deviceId) {
        return this.micStream;
      }
      // Switch to newly selected mic
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    // Attempt preferred vocal constraints with autoGainControl
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: true,
    };
    if (deviceId && deviceId !== 'default') {
      audioConstraints.deviceId = { ideal: deviceId };
    }

    let stream: MediaStream;
    try {
      console.log('[AudioCapture] Requesting microphone with constraints:', JSON.stringify(audioConstraints));
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });
    } catch (prefErr) {
      console.warn('[AudioCapture] Preferred constraints failed, falling back to simple { audio: true }:', prefErr);
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
      const settings = audioTrack.getSettings();
      console.log(`[AudioCapture] Candidate microphone active: "${audioTrack.label}" (id: ${audioTrack.id}, readyState: ${audioTrack.readyState}, muted: ${audioTrack.muted}, channels: ${settings.channelCount}, sampleRate: ${settings.sampleRate})`);

      audioTrack.onmute = () => {
        console.warn(`[AudioCapture] Microphone track was MUTED by system/driver: "${audioTrack.label}"`);
      };
      audioTrack.onunmute = () => {
        console.log(`[AudioCapture] Microphone track UNMUTED: "${audioTrack.label}"`);
      };
    } else {
      console.error('[AudioCapture] No audio track found on captured microphone stream!');
    }

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
    const rms = Math.sqrt(sum / (samples.length || 1));
    if (rms < 0.0003) return 0;
    // Square root curve maps quiet speech (0.004) -> ~20%, normal speech (0.02) -> ~45%, loud (0.06+) -> ~80%
    return Math.min(1.0, Math.sqrt(rms) * 3.2);
  }
}

export const audioCaptureService = new AudioCaptureService();
