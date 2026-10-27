import type { TranscriptMessage } from './localWhisperClient';

export type QuestionDetectedCallback = (
  question: string,
  recentContext: TranscriptMessage[],
  source?: 'interviewer' | 'candidate'
) => void;

export type CandidateAnswerCallback = (
  candidateSpoken: string,
  precedingQuestion: string
) => void;

export class QuestionDetector {
  private recentMessages: TranscriptMessage[] = [];
  private debounceTimer: any = null;
  private candidateAnswerTimer: any = null;
  private readonly debounceDelayMs: number = 1200;
  private readonly candidateEvalDelayMs: number = 1800;
  private onQuestionCallbacks: QuestionDetectedCallback[] = [];
  private onCandidateAnswerCallbacks: CandidateAnswerCallback[] = [];
  private lastActiveQuestion: string = '';
  private pendingCandidateChunks: string[] = [];

  // Common question starters & keywords in technical interviews
  private readonly questionKeywords: RegExp[] = [
    /\b(how|why|what|when|where|who|which)\b/i,
    /\b(can you|could you|would you|will you)\b/i,
    /\b(tell me about|explain|describe|walk me through|clarify)\b/i,
    /\b(have you (ever|worked|used|built|designed))\b/i,
    /\b(what's your experience|how do you handle|what are the trade-offs)\b/i,
    /\?$/,
  ];

  // Topic clarification patterns when candidate speaks
  private readonly candidateTopicPatterns: RegExp[] = [
    /\b(?:so\s+(?:you\s+are|you're)\s+asking\s+about|asking\s+about|asked\s+about)\s+(?:the\s+|how\s+to\s+)?(.+)/i,
    /\b(?:so\s+you\s+want\s+me\s+to|you\s+want\s+me\s+to|you'd\s+like\s+me\s+to)\s+(.+)/i,
    /\b(?:how\s+to\s+design|how\s+do\s+we\s+design|how\s+should\s+we\s+design|design\s+a|design\s+an)\s+(.+)/i,
    /\b(?:can\s+we\s+solve\s+this\s+with|can\s+we\s+use|what\s+if\s+we\s+use)\s+(.+)/i,
    /\b(?:the\s+question\s+is\s+about|the\s+problem\s+is\s+about)\s+(.+)/i,
    /\b(?:let's\s+design|let's\s+implement|let's\s+solve)\s+(.+)/i,
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

  public onCandidateAnswer(callback: CandidateAnswerCallback): () => void {
    this.onCandidateAnswerCallbacks.push(callback);
    return () => {
      this.onCandidateAnswerCallbacks = this.onCandidateAnswerCallbacks.filter((cb) => cb !== callback);
    };
  }

  public setLastActiveQuestion(question: string): void {
    this.lastActiveQuestion = question;
  }

  public getLastActiveQuestion(): string {
    return this.lastActiveQuestion;
  }

  public extractCandidateTopic(text: string): string | null {
    for (const re of this.candidateTopicPatterns) {
      const match = text.match(re);
      if (match && match[1]) {
        let cleaned = match[1].replace(/[.,?!]+$/, '').trim();
        if (cleaned.length >= 4) {
          if (/how\s+to\s+design/i.test(match[0]) && !/^design/i.test(cleaned)) {
            return `Design ${cleaned}`;
          }
          return cleaned;
        }
      }
    }

    // Direct question asked by candidate ending in ? with question keywords
    if (text.includes('?') && /\b(how|why|what|can|could|should|which)\b/i.test(text)) {
      return text.trim();
    }

    return null;
  }

  public processTranscript(message: TranscriptMessage): void {
    this.recentMessages.push(message);
    if (this.recentMessages.length > 25) {
      this.recentMessages.shift();
    }

    if (!message.isFinal) {
      return;
    }

    const text = message.text.trim();
    if (this.isFiller(text)) {
      return;
    }

    // ── 1. Candidate Audio Stream Intelligence ──
    if (message.speaker === 'candidate') {
      // Check if candidate clarified or stated a topic/question
      const candidateTopic = this.extractCandidateTopic(text);
      if (candidateTopic) {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.lastActiveQuestion = candidateTopic;
          this.emitQuestion(candidateTopic, 'candidate');
        }, 800);
        return;
      }

      // If candidate is explaining/answering an active question, evaluate their response
      if (this.lastActiveQuestion) {
        this.pendingCandidateChunks.push(text);
        if (this.candidateAnswerTimer) clearTimeout(this.candidateAnswerTimer);

        this.candidateAnswerTimer = setTimeout(() => {
          const fullCandidateAnswer = this.pendingCandidateChunks.join(' ').trim();
          this.pendingCandidateChunks = [];
          // Require at least 6 words of substantive explanation to evaluate
          if (fullCandidateAnswer.split(/\s+/).length >= 6) {
            this.emitCandidateAnswer(fullCandidateAnswer, this.lastActiveQuestion);
          }
        }, this.candidateEvalDelayMs);
      }
      return;
    }

    // ── 2. Interviewer Audio Stream Intelligence ──
    if (this.isLikelyQuestion(text)) {
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
        this.lastActiveQuestion = fullQuestion;
        this.emitQuestion(fullQuestion, 'interviewer');
      }, this.debounceDelayMs);
    }
  }

  public triggerManual(questionText?: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

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

    this.lastActiveQuestion = textToAsk;
    this.emitQuestion(textToAsk, 'interviewer');
  }

  public isLikelyQuestion(text: string): boolean {
    if (text.length < 5) return false;
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
    this.lastActiveQuestion = '';
    this.pendingCandidateChunks = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.candidateAnswerTimer) {
      clearTimeout(this.candidateAnswerTimer);
      this.candidateAnswerTimer = null;
    }
  }

  private emitQuestion(question: string, source: 'interviewer' | 'candidate' = 'interviewer'): void {
    const contextSnapshot = [...this.recentMessages];
    this.onQuestionCallbacks.forEach((cb) => cb(question, contextSnapshot, source));
  }

  private emitCandidateAnswer(candidateSpoken: string, precedingQuestion: string): void {
    this.onCandidateAnswerCallbacks.forEach((cb) => cb(candidateSpoken, precedingQuestion));
  }
}

export const questionDetector = new QuestionDetector();
