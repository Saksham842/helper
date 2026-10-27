import type { TranscriptMessage } from './localWhisperClient';

export interface ConversationTurn {
  id?: string;
  role: 'interviewer' | 'ai_suggestion' | 'candidate_spoken';
  text: string;
  timestamp?: number;
}

export interface PromptContext {
  resumeText?: string;
  targetRole?: string;
  customInstructions?: string;
  targetLanguage?: string;
}

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class PromptEngine {
  private context: PromptContext = {
    targetRole: 'Software Engineer',
    targetLanguage: 'C++',
    customInstructions: 'Directly answer and solve what the interviewer is asking. Provide working modern C++ code and complexity for DSA/coding problems, architecture for system design, and deep technical clarity for concepts.',
  };

  public setContext(newContext: Partial<PromptContext>): void {
    this.context = {
      ...this.context,
      ...newContext,
    };
  }

  public getContext(): PromptContext {
    return { ...this.context };
  }

  private lastSolvedCodeMarkdown?: string;

  public injectSolvedCodeContext(solutionMarkdown: string): void {
    if (!solutionMarkdown) return;
    this.lastSolvedCodeMarkdown = solutionMarkdown.slice(0, 3000);
  }

  public getLastSolvedCode(): string | undefined {
    return this.lastSolvedCodeMarkdown;
  }

  public buildEvaluationSystemPrompt(): string {
    return `You are GhostPilot, an expert technical interview coach and live evaluator.
The candidate is on a live interview and just spoke an explanation or answer into their microphone.
Analyze the candidate's spoken response against the question and provide an actionable, ultra-scannable coaching card:

### EVALUATION & COACHING
- **Strong Points**: (1 punchy bullet point on what the candidate articulated well, accurate concepts, or good instincts)
- **Missing / Blindspots**: (1-2 bullet points on critical edge cases, scale constraints, time/space complexity trade-offs, or algorithms they missed)
- **What to say next**: (1-2 exact sentences the candidate should say out loud right now to impress the interviewer and address the blindspots)

Keep the feedback under 150 words, completely free of generic fluff or filler. Jump straight into the headers.`;
  }

  public buildSystemPrompt(): string {
    const lang = this.context.targetLanguage || 'C++';
    let prompt = `You are GhostPilot, an expert real-time technical interview copilot.
The candidate is on a live interview call. Your output is rendered on a stealth overlay HUD that the candidate glances at.

CRITICAL INSTRUCTIONS BY QUESTION TYPE:

1. CODING / ALGORITHMS / LEETCODE / DSA:
You MUST structure your coding solutions in this EXACT 5-TIER SEQUENCE:

### 1. INTUITION / WHAT TO SAY
- 2-3 natural, first-person sentences the candidate should say out loud to the interviewer immediately.

### 2. BRUTE FORCE APPROACH
- Describe the naive approach, why it works, and state:
  - Time Complexity: O(...) | Space Complexity: O(...)

### 3. OPTIMAL APPROACH & CONCEPT
- Explain the conceptual optimal strategy (which algorithm, data structure, invariant, or technique to use and why it improves upon brute force) to explain to the interviewer BEFORE writing code.

### 4. OPTIMAL ${lang} CODE
- Complete, clean, runnable modern ${lang} code (using C++20 STL, std::vector, std::unordered_map, etc.) with zero omitted lines.

### 5. OPTIMAL COMPLEXITY & EDGE CASES
- Time Complexity: O(...) - [1-line justification]
- Space Complexity: O(...) - [1-line justification]
- 2-3 critical edge cases to highlight.

2. MULTI-TURN FOLLOW-UP & RECONCILIATION:
- When the interviewer asks a follow-up question, critique, or counter-probe based on what the candidate actually spoke ([Candidate Spoken]), explicitly reconcile what the candidate said with the interviewer's new question.
- Generate the strongest, most natural continuation, justification, or defense answer directly addressing the interviewer's specific probe while staying consistent with what the candidate already articulated.

3. SYSTEM DESIGN & ARCHITECTURE:
- Outline the High-Level Architecture (Core services, API contracts, data flow).
- Specify Data Storage & Caching (PostgreSQL, Redis, Kafka, Partitioning keys).
- Address Scalability & Fault Tolerance (Load balancers, rate limiters, replication, circuit breakers).

4. TECHNICAL CONCEPTS & SYSTEM INTERNALS:
- Give a crisp 1-sentence definition.
- Explain how it works under the hood (memory layout, concurrency, runtime lifecycle).
- Give a quick code snippet or real-world example demonstrating the concept in ${lang}.

5. BEHAVIORAL / EXPERIENCE (ONLY if specifically asked about past personal experience):
- Structure with STAR (Situation, Task, Action, Result) with measurable metrics.

FORMATTING & STYLE:
- Use clean Markdown with headers (\`### 1. INTUITION / WHAT TO SAY\`, \`### 2. BRUTE FORCE APPROACH\`, \`### 3. OPTIMAL APPROACH & CONCEPT\`, \`### 4. OPTIMAL ${lang} CODE\`, \`### 5. OPTIMAL COMPLEXITY & EDGE CASES\`).
- Use fenced code blocks (\`\`\`${lang.toLowerCase() === 'c++' ? 'cpp' : lang.toLowerCase()} ... \`\`\`) with clean syntax.
- Bold key terms (**like this**).
- Jump straight into the solution with zero introductory filler ("Sure! Here is the answer").`;

    if (this.context.targetRole) {
      prompt += `\n\nTarget Role: ${this.context.targetRole}`;
    }

    if (this.context.customInstructions) {
      prompt += `\nCandidate Instructions: ${this.context.customInstructions}`;
    }

    if (this.context.resumeText) {
      prompt += `\nCandidate Background Summary:\n${this.context.resumeText.slice(0, 3000)}`;
    }

    if (this.lastSolvedCodeMarkdown) {
      prompt += `\n\n[Active Solved Coding Problem Context - Ready for Follow-up Probes]:\n${this.lastSolvedCodeMarkdown}`;
    }

    return prompt;
  }

  public buildMessages(
    question: string,
    history: (ConversationTurn | TranscriptMessage)[] = [],
    mode: 'solution' | 'evaluation' = 'solution'
  ): GroqChatMessage[] {
    const messages: GroqChatMessage[] = [];

    // System prompt
    const systemPrompt = mode === 'evaluation'
      ? this.buildEvaluationSystemPrompt()
      : this.buildSystemPrompt();

    messages.push({ role: 'system', content: systemPrompt });

    // Multi-turn history (last 8 relevant items)
    const recentHistory = history.slice(-8);
    for (const item of recentHistory) {
      if ('role' in item) {
        if (item.role === 'interviewer') {
          messages.push({ role: 'user', content: `[Interviewer Question]: ${item.text}` });
        } else if (item.role === 'candidate_spoken') {
          messages.push({ role: 'user', content: `[Candidate Spoken]: ${item.text}` });
        } else if (item.role === 'ai_suggestion') {
          messages.push({ role: 'assistant', content: item.text });
        }
      } else {
        const prefix = item.speaker === 'interviewer' ? '[Interviewer Question]' : '[Candidate Spoken]';
        messages.push({ role: 'user', content: `${prefix}: ${item.text}` });
      }
    }

    // Current query
    if (mode === 'evaluation') {
      messages.push({
        role: 'user',
        content: `Evaluate the candidate's spoken response to the question: "${question}". Provide strong points, missing blindspots, and what to say next.`
      });
    } else {
      messages.push({
        role: 'user',
        content: `[Current Question / Topic to Solve]: "${question}"\n\nProvide the complete, optimal technical solution now:`
      });
    }

    return messages;
  }

  public buildUserPrompt(
    question: string,
    history: (ConversationTurn | TranscriptMessage)[] = []
  ): string {
    const formattedHistory = history
      .slice(-10)
      .map((item) => {
        if ('role' in item) {
          if (item.role === 'interviewer') return `[Interviewer]: ${item.text}`;
          if (item.role === 'ai_suggestion') return `[AI Copilot Suggested]: ${item.text}`;
          return `[Candidate Spoken]: ${item.text}`;
        }
        return `${item.speaker === 'interviewer' ? '[Interviewer]' : '[Candidate Spoken]'}: ${item.text}`;
      })
      .join('\n');

    let prompt = '';

    if (this.context.targetRole) {
      prompt += `Target Role: ${this.context.targetRole}\n`;
    }

    if (this.context.customInstructions) {
      prompt += `Candidate Instructions: ${this.context.customInstructions}\n`;
    }

    if (this.context.resumeText) {
      prompt += `\nCandidate Background Summary:\n${this.context.resumeText.slice(0, 4000)}\n`;
    }

    if (formattedHistory) {
      prompt += `\nLive Conversation History (Multi-Turn Context):\n${formattedHistory}\n`;
    }

    prompt += `\nINTERVIEWER'S CURRENT QUESTION / PROBE TO SOLVE:\n"${question}"\n\nProvide the complete, optimal, and thorough response now:`;

    return prompt;
  }

  public async syncActiveContext(
    apiUrl: string = 'http://localhost:3000/api/vault/active',
    token?: string
  ): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(apiUrl, { headers });
      if (!res.ok) return false;

      const data = await res.json();
      if (data.hasActiveResume || data.extractedText) {
        this.setContext({
          resumeText: data.extractedText || undefined,
          targetRole: data.targetRole || this.context.targetRole,
          customInstructions: data.customInstructions || this.context.customInstructions,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PromptEngine] Active resume sync skipped or offline:', err);
      return false;
    }
  }
}

export const promptEngine = new PromptEngine();
