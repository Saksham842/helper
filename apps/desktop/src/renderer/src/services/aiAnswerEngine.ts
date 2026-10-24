import { promptEngine } from './promptEngine';
import type { TranscriptMessage } from './deepgramLiveClient';

export type TokenCallback = (token: string, fullText: string) => void;
export type CompletionCallback = (fullAnswer: string) => void;
export type ErrorCallback = (error: string) => void;

export class AIAnswerEngine {
  private apiKey: string = '';
  private currentAbortController: AbortController | null = null;
  private isGenerating: boolean = false;
  private currentQuestion: string = '';
  private currentAnswer: string = '';

  private onTokenCallbacks: TokenCallback[] = [];
  private onCompleteCallbacks: CompletionCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  constructor() {
    const saved = localStorage.getItem('parakeet_anthropic_api_key');
    if (saved) {
      this.apiKey = saved;
    }
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim();
    localStorage.setItem('parakeet_anthropic_api_key', this.apiKey);
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public onToken(callback: TokenCallback): () => void {
    this.onTokenCallbacks.push(callback);
    return () => {
      this.onTokenCallbacks = this.onTokenCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onComplete(callback: CompletionCallback): () => void {
    this.onCompleteCallbacks.push(callback);
    return () => {
      this.onCompleteCallbacks = this.onCompleteCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter((cb) => cb !== callback);
    };
  }

  public cancel(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.isGenerating = false;
  }

  public async generateAnswer(question: string, history: TranscriptMessage[] = []): Promise<void> {
    if (!this.apiKey) {
      this.onErrorCallbacks.forEach((cb) =>
        cb('Anthropic API Key is not set. Please provide your API key in the HUD settings drawer.')
      );
      return;
    }

    // Cancel any active generation
    this.cancel();

    this.isGenerating = true;
    this.currentQuestion = question;
    this.currentAnswer = '';
    this.currentAbortController = new AbortController();

    const systemPrompt = promptEngine.buildSystemPrompt();
    const userPrompt = promptEngine.buildUserPrompt(question, history);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 600,
          temperature: 0.2,
          stream: true,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: this.currentAbortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API Error (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const eventData = JSON.parse(dataStr);
              if (
                eventData.type === 'content_block_delta' &&
                eventData.delta?.type === 'text_delta' &&
                eventData.delta.text
              ) {
                const token = eventData.delta.text;
                this.currentAnswer += token;
                this.onTokenCallbacks.forEach((cb) => cb(token, this.currentAnswer));
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }
      }

      this.isGenerating = false;
      this.onCompleteCallbacks.forEach((cb) => cb(this.currentAnswer));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Normal cancellation
      }
      this.isGenerating = false;
      console.error('Streaming generation error:', err);
      this.onErrorCallbacks.forEach((cb) => cb(err.message || 'Error streaming AI answer'));
    }
  }

  public getStatus() {
    return {
      isGenerating: this.isGenerating,
      currentQuestion: this.currentQuestion,
      currentAnswer: this.currentAnswer,
    };
  }
}

export const aiAnswerEngine = new AIAnswerEngine();
