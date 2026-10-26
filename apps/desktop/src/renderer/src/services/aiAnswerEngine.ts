import { promptEngine } from './promptEngine';
import type { TranscriptMessage } from './localWhisperClient';

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
    // Priority: localStorage override > .env baked-in key
    const envKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    const saved = localStorage.getItem('ghostpilot_groq_api_key');
    this.apiKey = saved || envKey;
    if (envKey && !saved) {
      // Persist the env key to localStorage so it survives without re-reading env
      localStorage.setItem('ghostpilot_groq_api_key', envKey);
    }
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim();
    localStorage.setItem('ghostpilot_groq_api_key', this.apiKey);
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
        cb('Groq API Key required. Paste your key (starts with gsk_) in the input below to enable AI answers.')
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
      let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model:
            (import.meta as any).env?.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
          max_tokens: 600,
          temperature: 0.2,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: this.currentAbortController.signal,
      });

      if (!response.ok) {
        console.warn(`[AIAnswerEngine] Primary model failed (${response.status}), retrying with fast fallback...`);
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            max_tokens: 600,
            temperature: 0.2,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: this.currentAbortController.signal,
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error (${response.status}): ${errorText}`);
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
              const token = eventData.choices?.[0]?.delta?.content;
              if (token) {
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
