import type { TranscriptMessage } from './localWhisperClient';

export type QuestionDetectedCallback = (question: string, recentContext: TranscriptMessage[]) => void;

export class QuestionDetector {
  private recentMessages: TranscriptMessage[] = [];
  private debounceTimer: any = null;
  private readonly debounceDelayMs: number = 1200;
  private onQuestionCallbacks: QuestionDetectedCallback[] = [];

  // Common question starters & keywords in technical interviews
  private readonly questionKeywords: RegExp[] = [
    /\b(how|why|what|when|where|who|which)\b/i,
    /\b(can you|could you|would you|will you)\b/i,
    /\b(tell me about|explain|describe|walk me through|clarify)\b/i,
    /\b(have you (ever|worked|used|built|designed))\b/i,
    /\b(what's your experience|how do you handle|what are the trade-offs)\b/i,
    /\?$/,
  ];

  // Affirmations, greetings, and filler phrases that should not trigger question answering
  private readonly fillerPhrases: RegExp[] = [
    /^(yeah|yes|yep|sure|okay|ok|right|cool|got it|sounds good|mhm|understood|alright)\.?$/i,
    /^(thank you|thanks|no problem|awesome|great)\.?$/i,
    /^(good (morning|afternoon|evening|day))\.?$/i,
    /^(how are you|how're you|how are you doing|how is it going)\??$/i,
    /^(hello|hi|hey|welcome back|welcome)\.?$/i,
  ];

  public onQuestion(callback: QuestionDetectedCallback): () => void {
    this.onQuestionCallbacks.push(callback);
    return () => {
      this.onQuestionCallbacks = this.onQuestionCallbacks.filter((cb) => cb !== callback);
    };
  }

  public processTranscript(message: TranscriptMessage): void {
    this.recentMessages.push(message);
    if (this.recentMessages.length > 20) {
      this.recentMessages.shift();
    }

    // Only inspect interviewer speech for automatic questions
    if (message.speaker !== 'interviewer') {
      return;
    }

    if (!message.isFinal) {
      return;
    }

    const text = message.text.trim();
    if (this.isFiller(text)) {
      return;
    }

    if (this.isLikelyQuestion(text)) {
      // Clear previous debounce
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        // Aggregate recent contiguous interviewer utterances so the full question context is preserved
        const interviewerChunks: string[] = [];
        for (let i = this.recentMessages.length - 1; i >= 0; i--) {
          const m = this.recentMessages[i];
          if (m.speaker === 'interviewer') {
            interviewerChunks.unshift(m.text.trim());
            if (interviewerChunks.length >= 4) break;
          } else {
            break;
          }
        }
        const fullQuestion = interviewerChunks.join(' ') || text;
        this.emitQuestion(fullQuestion);
      }, this.debounceDelayMs);
    }
  }

  public triggerManual(questionText?: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // If explicit question provided, use it; otherwise extract recent interviewer context
    let textToAsk = questionText?.trim();
    if (!textToAsk) {
      const interviewerChunks: string[] = [];
      for (let i = this.recentMessages.length - 1; i >= 0; i--) {
        const m = this.recentMessages[i];
        if (m.speaker === 'interviewer') {
          interviewerChunks.unshift(m.text.trim());
          if (interviewerChunks.length >= 4) break;
        } else {
          break;
        }
      }
      textToAsk = interviewerChunks.join(' ') || 'Provide the solution and key points for the current interview topic.';
    }

    this.emitQuestion(textToAsk);
  }

  public isLikelyQuestion(text: string): boolean {
    if (text.length < 5) return false;
    // Don't treat standalone greetings as questions
    if (/^(how are you|how're you|how is it going)\??$/i.test(text.trim())) return false;
    if (text.includes('?')) return true;
    return this.questionKeywords.some((pattern) => pattern.test(text));
  }

  public isFiller(text: string): boolean {
    const trimmed = text.trim();
    return this.fillerPhrases.some((pattern) => pattern.test(trimmed));
  }

  public getRecentContext(): TranscriptMessage[] {
    return [...this.recentMessages];
  }

  public clearHistory(): void {
    this.recentMessages = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private emitQuestion(question: string): void {
    const contextSnapshot = [...this.recentMessages];
    this.onQuestionCallbacks.forEach((cb) => cb(question, contextSnapshot));
  }
}

export const questionDetector = new QuestionDetector();
