import type { SpeakerRole } from '@parakeet/shared';

export interface TranscriptMessage {
  id: string;
  speaker: SpeakerRole;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type TranscriptCallback = (message: TranscriptMessage) => void;
export type StatusCallback = (status: ConnectionStatus, error?: string) => void;

export class DeepgramLiveClient {
  private socket: WebSocket | null = null;
  private apiKey: string = '';
  private status: ConnectionStatus = 'disconnected';
  private keepAliveTimer: any = null;
  private reconnectAttempts: number = 0;
  private shouldReconnect: boolean = false;

  private onTranscriptCallbacks: TranscriptCallback[] = [];
  private onStatusCallbacks: StatusCallback[] = [];

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim();
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public onTranscript(callback: TranscriptCallback): () => void {
    this.onTranscriptCallbacks.push(callback);
    return () => {
      this.onTranscriptCallbacks = this.onTranscriptCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.onStatusCallbacks.push(callback);
    return () => {
      this.onStatusCallbacks = this.onStatusCallbacks.filter((cb) => cb !== callback);
    };
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (!this.apiKey) {
      this.updateStatus('error', 'Deepgram API Key is required. Please provide a key in settings or web dashboard.');
      return;
    }

    this.shouldReconnect = true;
    this.updateStatus('connecting');

    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en-US',
      smart_format: 'true',
      interim_results: 'true',
      diarize: 'true',
      multichannel: 'true',
      encoding: 'linear16',
      sample_rate: '16000',
      channels: '2',
    });

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    try {
      // In browser WebSocket, auth token is passed via subprotocol ['token', apiKey]
      this.socket = new WebSocket(url, ['token', this.apiKey]);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
        this.startKeepAlive();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onerror = (err) => {
        console.error('Deepgram WebSocket error:', err);
        this.updateStatus('error', 'WebSocket connection failed');
      };

      this.socket.onclose = () => {
        this.stopKeepAlive();
        if (this.shouldReconnect && this.reconnectAttempts < 5) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          this.updateStatus('connecting', `Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/5)...`);
          setTimeout(() => this.connect(), delay);
        } else {
          this.updateStatus('disconnected');
        }
      };
    } catch (err: any) {
      console.error('Failed to instantiate WebSocket:', err);
      this.updateStatus('error', err.message || 'Connection error');
    }
  }

  public sendAudioChunk(pcmChunk: ArrayBuffer): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(pcmChunk);
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.stopKeepAlive();
    if (this.socket) {
      try {
        // Send Deepgram close stream message
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'CloseStream' }));
        }
        this.socket.close();
      } catch (e) {
        console.error('Error closing WebSocket:', e);
      }
      this.socket = null;
    }
    this.updateStatus('disconnected');
  }

  private handleMessage(data: string | ArrayBuffer): void {
    if (typeof data !== 'string') return;

    try {
      const response = JSON.parse(data);

      if (response.type === 'Results' && response.channel) {
        const alt = response.channel.alternatives?.[0];
        if (!alt || !alt.transcript?.trim()) return;

        // In multichannel mode, channel_index indicates:
        // 0 -> Interviewer (loopback left)
        // 1 -> Candidate (mic right)
        const channelIndex = response.channel_index?.[0] ?? 0;
        const speakerRole: SpeakerRole = channelIndex === 0 ? 'interviewer' : 'candidate';

        const message: TranscriptMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          speaker: speakerRole,
          text: alt.transcript.trim(),
          timestamp: Date.now(),
          isFinal: Boolean(response.is_final),
        };

        this.onTranscriptCallbacks.forEach((cb) => cb(message));
      }
    } catch (err) {
      console.error('Failed to parse Deepgram message:', err);
    }
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    // Deepgram timeout is 10 seconds of silence; send KeepAlive every 8 seconds
    this.keepAliveTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 8000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private updateStatus(status: ConnectionStatus, error?: string): void {
    this.status = status;
    this.onStatusCallbacks.forEach((cb) => cb(status, error));
  }
}

export const deepgramLiveClient = new DeepgramLiveClient();
