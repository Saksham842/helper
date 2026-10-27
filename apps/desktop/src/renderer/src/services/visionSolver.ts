import { groqKeyManager } from './groqKeyManager';

export interface VisionSolution {
  problemTitle: string;
  timeComplexity: string;
  spaceComplexity: string;
  approach: string;
  code: string;
  fullMarkdown: string;
}

export type VisionTokenCallback = (token: string, fullMarkdown: string) => void;
export type VisionCompleteCallback = (solution: VisionSolution) => void;
export type VisionErrorCallback = (error: string) => void;

export class VisionSolverService {
  private isAnalyzing: boolean = false;
  private currentAbortController: AbortController | null = null;
  private lastSolutionMarkdown: string = '';
  private onTokenCallbacks: VisionTokenCallback[] = [];
  private onCompleteCallbacks: VisionCompleteCallback[] = [];
  private onErrorCallbacks: VisionErrorCallback[] = [];

  public onToken(callback: VisionTokenCallback): () => void {
    this.onTokenCallbacks.push(callback);
    return () => {
      this.onTokenCallbacks = this.onTokenCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onComplete(callback: VisionCompleteCallback): () => void {
    this.onCompleteCallbacks.push(callback);
    return () => {
      this.onCompleteCallbacks = this.onCompleteCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onError(callback: VisionErrorCallback): () => void {
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
    this.isAnalyzing = false;
  }

  public async captureAndSolve(targetLanguage: string = 'C++'): Promise<void> {
    const activeKey = groqKeyManager.getActiveKey();
    if (!activeKey) {
      this.onErrorCallbacks.forEach((cb) =>
        cb('Groq API key required for Vision Solver. Paste your key (starts with gsk_) in the input above.')
      );
      return;
    }

    if (!window.electronAPI?.captureSilentScreenshot) {
      this.onErrorCallbacks.forEach((cb) => cb('Electron silent capture API is not available in this environment.'));
      return;
    }

    this.cancel();
    this.isAnalyzing = true;
    this.currentAbortController = new AbortController();

    try {
      // 1. Capture silent screenshot completely in-memory
      const dataUrl = await window.electronAPI.captureSilentScreenshot();
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageUrl = dataUrl.startsWith('data:') ? dataUrl : `data:image/jpeg;base64,${base64Data}`;

      const langFence = targetLanguage.toLowerCase() === 'c++' ? 'cpp' : targetLanguage.toLowerCase();

      // 2. Query Groq Multimodal Vision Model with strict top-to-bottom prompt ordering
      const systemPrompt = `You are an expert algorithm engineer and competitive programmer.
Your task is to analyze the coding problem visible in the provided screenshot (from LeetCode, HackerRank, Codeforces, an IDE, or an assessment platform) and provide the optimal, complete solution in ${targetLanguage}.

STRICT FORMAT AND 5-TIER SEQUENCE REQUIREMENTS:
You MUST structure your response in this EXACT top-to-bottom order:

### 1. Intuition / What to Say Out Loud
- [3–4 natural, conversational bullet points written strictly in first-person speech (e.g., "My initial intuition here is to use two pointers because...", "To avoid an O(N²) nested loop, we can track...") that the candidate can read verbatim out loud to the interviewer]

### 2. Brute Force Approach & Complexity
- **Approach:** [Concise description of the naive/brute force approach and why it is suboptimal at scale]
- **Time Complexity:** O(...) | **Space Complexity:** O(...)

### 3. Optimal Approach & Concept
- **Concept & Strategy:** [Explain the optimal algorithmic strategy, invariant, and data structures (e.g., Monotonic Stack, Two Pointers, Trie, Hash Map) and why it reduces time/space complexity compared to brute force. Explain this clearly to the interviewer BEFORE writing code]

### 4. Solution (${targetLanguage})
\`\`\`${langFence}
// Full, production-ready, complete modern ${targetLanguage} code.
// MANDATORY: You must write the ENTIRE implementation from start to finish.
// Include all necessary standard library headers (#include <vector>, <string>, <unordered_map>, <algorithm>, etc.).
// If custom data structures are required (such as TreeNode, ListNode, or custom Comparator), provide their complete definitions.
// Implement all helper functions and the full Solution class methods without skipping any lines, without using ellipses (...), and without placeholder comments like '// implement here'.
\`\`\`

### 5. Complexity & Edge Cases
- **Time Complexity:** O(...) - [1-line concise justification]
- **Space Complexity:** O(...) - [1-line concise justification]
- **Edge Cases:** [2-3 critical edge cases to mention to the interviewer (empty inputs, single element, negative values, boundary overflow)]`;

      const userText = `Please identify and solve the coding problem visible in this screenshot in ${targetLanguage}.
Provide (1) intuition script to read aloud, (2) brute force approach and complexity, (3) optimal conceptual approach to explain before coding, (4) complete ${targetLanguage} solution code, and (5) optimal complexity with edge cases.`;

      // Use Groq's multimodal vision model
      const visionModel =
        (import.meta as any).env?.VITE_GROQ_VISION_MODEL ||
        'qwen/qwen3.8-27b';

      let response = await groqKeyManager.fetchWithFallback(
        'https://api.groq.com/openai/v1/chat/completions',
        (key) => ({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: visionModel,
            max_tokens: 2500,
            temperature: 0.1,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: userText,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],
          }),
          signal: this.currentAbortController?.signal,
        })
      );

      if (!response.ok) {
        const errorText = await response.text();
        let parsedMessage = errorText;
        try {
          const errJson = JSON.parse(errorText);
          if (errJson?.error?.message) {
            parsedMessage = errJson.error.message;
          }
        } catch {}

        if (response.status === 429) {
          throw new Error(
            `Groq Vision Rate Limit (429): ${parsedMessage}. Note: Both configured keys share the same Groq account quota. To resolve immediately, use a key from a separate Groq account or type the problem title directly.`
          );
        }
        throw new Error(`Vision API Error (${response.status}): ${parsedMessage}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullMarkdown = '';
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
                fullMarkdown += token;
                this.onTokenCallbacks.forEach((cb) => cb(token, fullMarkdown));
              }
            } catch {
              // Ignore non-json
            }
          }
        }
      }

      this.isAnalyzing = false;
      this.lastSolutionMarkdown = fullMarkdown;
      const parsed = this.parseSolution(fullMarkdown);
      this.onCompleteCallbacks.forEach((cb) => cb(parsed));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      this.isAnalyzing = false;
      console.error('Vision Solver error:', err);
      this.onErrorCallbacks.forEach((cb) => cb(err.message || 'Vision solve error'));
    }
  }

  public getIsAnalyzing(): boolean {
    return this.isAnalyzing;
  }

  public getLastSolutionMarkdown(): string {
    return this.lastSolutionMarkdown;
  }

  public parseSolution(markdown: string): VisionSolution {
    // Extract code block
    const codeMatch = markdown.match(/```(?:\w+)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : '';

    // Extract optimal time & space complexity placed strictly after the code block
    const firstCodeFence = markdown.indexOf('```');
    const secondCodeFence = firstCodeFence >= 0 ? markdown.indexOf('```', firstCodeFence + 3) : -1;
    const postCodeSection = secondCodeFence >= 0 ? markdown.slice(secondCodeFence + 3) : markdown;

    const timeMatch = postCodeSection.match(/Time Complexity:?\*\*?\s*O\(([^)]+)\)/i);
    const spaceMatch = postCodeSection.match(/Space Complexity:?\*\*?\s*O\(([^)]+)\)/i);

    const timeComplexity = timeMatch ? `O(${timeMatch[1]})` : 'O(N)';
    const spaceComplexity = spaceMatch ? `O(${spaceMatch[1]})` : 'O(1)';

    return {
      problemTitle: 'Screen Problem Solution',
      timeComplexity,
      spaceComplexity,
      approach: 'Optimal Algorithmic Approach',
      code,
      fullMarkdown: markdown,
    };
  }
}

export const visionSolverService = new VisionSolverService();
