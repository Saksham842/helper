import { promptEngine, type ConversationTurn } from './promptEngine';
import type { TranscriptMessage } from './localWhisperClient';
import { groqKeyManager } from './groqKeyManager';

export type TokenCallback = (token: string, fullText: string) => void;
export type CompletionCallback = (fullAnswer: string) => void;
export type ErrorCallback = (error: string) => void;

export class AIAnswerEngine {
  private currentAbortController: AbortController | null = null;
  private isGenerating: boolean = false;
  private currentQuestion: string = '';
  private currentAnswer: string = '';

  private evaluationAbortController: AbortController | null = null;
  private isEvaluating: boolean = false;
  private currentEvaluation: string = '';

  private onTokenCallbacks: TokenCallback[] = [];
  private onCompleteCallbacks: CompletionCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  private onEvaluationTokenCallbacks: TokenCallback[] = [];
  private onEvaluationCompleteCallbacks: CompletionCallback[] = [];
  private onEvaluationErrorCallbacks: ErrorCallback[] = [];

  constructor() {
    // groqKeyManager initializes primary and fallback keys automatically
  }

  public setApiKey(key: string): void {
    groqKeyManager.setPrimaryApiKey(key);
  }

  public setFallbackApiKey(key: string): void {
    groqKeyManager.setFallbackApiKey(key);
  }

  public getApiKey(): string {
    return groqKeyManager.getActiveKey();
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

  public onEvaluationToken(callback: TokenCallback): () => void {
    this.onEvaluationTokenCallbacks.push(callback);
    return () => {
      this.onEvaluationTokenCallbacks = this.onEvaluationTokenCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onEvaluationComplete(callback: CompletionCallback): () => void {
    this.onEvaluationCompleteCallbacks.push(callback);
    return () => {
      this.onEvaluationCompleteCallbacks = this.onEvaluationCompleteCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onEvaluationError(callback: ErrorCallback): () => void {
    this.onEvaluationErrorCallbacks.push(callback);
    return () => {
      this.onEvaluationErrorCallbacks = this.onEvaluationErrorCallbacks.filter((cb) => cb !== callback);
    };
  }

  public cancel(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.isGenerating = false;

    if (this.evaluationAbortController) {
      this.evaluationAbortController.abort();
      this.evaluationAbortController = null;
    }
    this.isEvaluating = false;
  }

  public async generateAnswer(
    question: string,
    history: (ConversationTurn | TranscriptMessage)[] = []
  ): Promise<void> {
    const activeKey = groqKeyManager.getActiveKey();
    if (!activeKey) {
      this.onErrorCallbacks.forEach((cb) =>
        cb('Groq API Key required. Paste your key (starts with gsk_) in the input below to enable AI answers.')
      );
      return;
    }

    // Cancel active solution generation
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }

    this.isGenerating = true;
    this.currentQuestion = question;
    this.currentAnswer = '';
    this.currentAbortController = new AbortController();

    const messages = promptEngine.buildMessages(question, history, 'solution');

    try {
      let response = await groqKeyManager.fetchWithFallback(
        'https://api.groq.com/openai/v1/chat/completions',
        (key) => ({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: (import.meta as any).env?.VITE_GROQ_MODEL || 'openai/gpt-oss-120b',
            max_tokens: 1500,
            temperature: 0.1,
            stream: true,
            messages,
          }),
          signal: this.currentAbortController?.signal,
        })
      );

      if (!response.ok) {
        console.warn(`[AIAnswerEngine] Primary model failed (${response.status}), retrying with fallback model openai/gpt-oss-20b...`);
        response = await groqKeyManager.fetchWithFallback(
          'https://api.groq.com/openai/v1/chat/completions',
          (key) => ({
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/gpt-oss-20b',
              max_tokens: 1500,
              temperature: 0.1,
              stream: true,
              messages,
            }),
            signal: this.currentAbortController?.signal,
          })
        );
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
              const delta = eventData.choices?.[0]?.delta;
              const token = delta?.content ?? delta?.reasoning;
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

  public async evaluateAnswer(
    question: string,
    candidateSpoken: string,
    history: (ConversationTurn | TranscriptMessage)[] = []
  ): Promise<void> {
    const activeKey = groqKeyManager.getActiveKey();
    if (!activeKey) return;

    if (this.evaluationAbortController) {
      this.evaluationAbortController.abort();
      this.evaluationAbortController = null;
    }

    this.isEvaluating = true;
    this.currentEvaluation = '';
    this.evaluationAbortController = new AbortController();

    const evaluationHistory: (ConversationTurn | TranscriptMessage)[] = [
      ...history,
      { role: 'candidate_spoken', text: candidateSpoken },
    ];
    const messages = promptEngine.buildMessages(question, evaluationHistory, 'evaluation');

    try {
      let response = await groqKeyManager.fetchWithFallback(
        'https://api.groq.com/openai/v1/chat/completions',
        (key) => ({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: (import.meta as any).env?.VITE_GROQ_MODEL || 'openai/gpt-oss-120b',
            max_tokens: 600,
            temperature: 0.1,
            stream: true,
            messages,
          }),
          signal: this.evaluationAbortController?.signal,
        })
      );

      if (!response.ok) {
        console.warn(`[AIAnswerEngine] Evaluation primary model failed (${response.status}), retrying with openai/gpt-oss-20b...`);
        response = await groqKeyManager.fetchWithFallback(
          'https://api.groq.com/openai/v1/chat/completions',
          (key) => ({
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/gpt-oss-20b',
              max_tokens: 600,
              temperature: 0.1,
              stream: true,
              messages,
            }),
            signal: this.evaluationAbortController?.signal,
          })
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq Evaluation Error (${response.status}): ${errorText}`);
      }

      if (!response.body) return;

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
              const delta = eventData.choices?.[0]?.delta;
              const token = delta?.content ?? delta?.reasoning;
              if (token) {
                this.currentEvaluation += token;
                this.onEvaluationTokenCallbacks.forEach((cb) => cb(token, this.currentEvaluation));
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }
      }

      this.isEvaluating = false;
      this.onEvaluationCompleteCallbacks.forEach((cb) => cb(this.currentEvaluation));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      this.isEvaluating = false;
      console.warn('Answer evaluation error:', err);
      this.onEvaluationErrorCallbacks.forEach((cb) => cb(err.message || 'Error evaluating answer'));
    }
  }

  public getStatus() {
    return {
      isGenerating: this.isGenerating,
      isEvaluating: this.isEvaluating,
      currentQuestion: this.currentQuestion,
      currentAnswer: this.currentAnswer,
    };
  }
}

export const aiAnswerEngine = new AIAnswerEngine();
