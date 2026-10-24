import type { TranscriptMessage } from './deepgramLiveClient';

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

  // Affirmations and filler phrases that should not trigger question answering
  private readonly fillerPhrases: RegExp[] = [
    /^(yeah|yes|yep|sure|okay|ok|right|cool|got it|sounds good|mhm|understood|alright)\.?$/i,
    /^(thank you|thanks|no problem|awesome)\.?$/i,
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
        this.emitQuestion(text);
      }, this.debounceDelayMs);
    }
  }

  public triggerManual(questionText?: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // If explicit question provided, use it; otherwise extract latest interviewer utterance or context
    let textToAsk = questionText?.trim();
    if (!textToAsk) {
      const lastInterviewerMsg = [...this.recentMessages].reverse().find((m) => m.speaker === 'interviewer');
      textToAsk = lastInterviewerMsg ? lastInterviewerMsg.text : 'Provide key suggestions based on current conversation.';
    }

    this.emitQuestion(textToAsk);
  }

  public isLikelyQuestion(text: string): boolean {
    if (text.length < 5) return false;
    if (text.includes('?')) return true;
    return this.questionKeywords.some((pattern) => pattern.test(text));
  }

  public isFiller(text: string): boolean {
    return this.fillerPhrases.some((pattern) => pattern.test(text.trim()));
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
