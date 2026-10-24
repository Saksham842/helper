import type { TranscriptMessage } from './deepgramLiveClient';

export interface PromptContext {
  resumeText?: string;
  targetRole?: string;
  customInstructions?: string;
}

export class PromptEngine {
  private context: PromptContext = {
    targetRole: 'Senior Software Engineer',
    customInstructions: 'Provide 3 high-impact bullet points. Use STAR method when describing projects. Bold key technical keywords.',
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
    return `You are Parakeet AI, an undetectable, ultra-low latency real-time interview copilot.
The candidate is actively speaking to an interviewer on a live call.
Your output will be rendered on a stealth HUD that the candidate glances at while speaking.

CRITICAL INSTRUCTIONS:
1. Ultra-Scannable: Format answers in 3-4 concise bullet points maximum.
2. Bold Key Terms: Bold core technical keywords, metrics, or architecture patterns (**like this**).
3. First-Person Voice: Speak from the candidate's perspective ("I implemented...", "In my past work with...").
4. Tailor to Resume: Weave in relevant technologies and achievements from the candidate's resume context.
5. No Fluff: Zero introductory or concluding remarks. Jump straight to the bullets.`;
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
      prompt += `Custom Instructions: ${this.context.customInstructions}\n`;
    }

    if (this.context.resumeText) {
      prompt += `\nCandidate Resume Highlights:\n${this.context.resumeText.slice(0, 10000)}\n`;
    }

    if (formattedHistory) {
      prompt += `\nRecent Conversation Context:\n${formattedHistory}\n`;
    }

    prompt += `\nQuestion to Answer:\n"${question}"`;

    return prompt;
  }
}

export const promptEngine = new PromptEngine();
