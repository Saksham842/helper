import type { TranscriptMessage } from './deepgramLiveClient';

export interface PromptContext {
  resumeText?: string;
  targetRole?: string;
  customInstructions?: string;
}

export class PromptEngine {
  private context: PromptContext = {
    targetRole: 'Software Engineer',
    customInstructions: 'Directly answer and solve what the interviewer is asking. Provide working code and complexity for DSA/coding problems, architecture for system design, and deep technical clarity for concepts.',
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

  public buildSystemPrompt(): string {
    return `You are GhostPilot, an expert real-time technical interview copilot.
The candidate is on a live interview call. Your output is rendered on an overlay HUD that the candidate glances at.

CRITICAL INSTRUCTIONS BY QUESTION TYPE:

1. CODING / ALGORITHMS / LEETCODE / DSA:
- Immediately state the optimal algorithmic approach (e.g., Greedy with Custom Comparator, Two Pointers, Monotonic Stack, DP, BFS/DFS).
- State Time Complexity: O(...) and Space Complexity: O(...).
- Provide the EXACT, CLEAN, PRODUCTION-READY CODE solving the problem (in Python or language discussed).
- Provide a 2-3 line dry-run walkthrough on the interviewer's specific example.
- List 2 critical edge cases to mention to the interviewer.

2. SYSTEM DESIGN & ARCHITECTURE:
- Outline the High-Level Architecture (Core services, API contracts, data flow).
- Specify Data Storage & Caching (PostgreSQL, Redis, Kafka, Partitioning keys).
- Address Scalability & Fault Tolerance (Load balancers, rate limiters, replication, circuit breakers).

3. TECHNICAL CONCEPTS & SYSTEM INTERNALS:
- Give a crisp 1-sentence definition.
- Explain how it works under the hood (memory, concurrency, runtime lifecycle).
- Give a quick code snippet or real-world example demonstrating the concept.

4. BEHAVIORAL / EXPERIENCE (ONLY if specifically asked about past personal experience):
- Structure with STAR (Situation, Task, Action, Result) with measurable metrics.

FORMATTING & STYLE:
- Use clean Markdown with headers (\`### Approach\`, \`### Complexity\`, \`### Solution\`).
- Use fenced code blocks (\`\`\`python ... \`\`\`) with clear syntax.
- Bold key terms (**like this**).
- Jump straight into the solution with zero introductory filler ("Sure! Here is the answer").`;
  }

  public buildUserPrompt(question: string, history: TranscriptMessage[] = []): string {
    const formattedHistory = history
      .slice(-8)
      .map((msg) => `${msg.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${msg.text}`)
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
      prompt += `\nLive Conversation Transcript:\n${formattedHistory}\n`;
    }

    prompt += `\nINTERVIEWER'S QUESTION / PROBLEM TO SOLVE:\n"${question}"\n\nProvide the complete, optimal, and thorough solution now:`;

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
