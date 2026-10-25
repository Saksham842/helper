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

  public async captureAndSolve(targetLanguage: string = 'Python'): Promise<void> {
    const envKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    const apiKey = localStorage.getItem('ghostpilot_groq_api_key') || envKey;
    if (!apiKey) {
      this.onErrorCallbacks.forEach((cb) =>
        cb('Groq API key required for Vision Solver. Paste your key (starts with gsk_) in the input below.')
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

      // 2. Query Groq Llama 4 Maverick Vision with streaming
      const systemPrompt = `You are a world-champion competitive programmer and technical interview expert.
A coding problem (LeetCode, HackerRank, CoderPad, or system diagram) is displayed on screen.
Your job is to provide an undetectable, executive-grade solution optimized for live interviews with execution trace and complexity analysis.
Format your response cleanly:
### Problem
[Problem Name & 1-sentence summary]

### Complexity
- **Time Complexity:** O(...)
- **Space Complexity:** O(...)

### Optimal Approach
[2-3 bullet points explaining the core pattern (e.g. Sliding Window, Monotonic Stack, Dynamic Programming)]

### Solution (${targetLanguage})
\`\`\`${targetLanguage.toLowerCase()}
[Complete, production-ready, beautifully commented code]
\`\`\`

### Execution Logs & Trace
- [Step-by-step dry run on sample inputs with variable states]

### Edge Cases
- [Edge case 1]
- [Edge case 2]`;

      // Use Groq's multimodal vision model (qwen/qwen3.8-27b)
      const visionModel =
        (import.meta as any).env?.VITE_GROQ_VISION_MODEL ||
        'qwen/qwen3.8-27b';

      let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: visionModel,
          max_tokens: 1500,
          temperature: 0.1,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze the coding problem on my screen and provide the optimal solution in ${targetLanguage}.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
        }),
        signal: this.currentAbortController.signal,
      });

      if (!response.ok) {
        console.warn(`[VisionSolver] Primary model failed (${response.status}), retrying with fallback model...`);
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            max_tokens: 1500,
            temperature: 0.1,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze the coding problem on my screen and provide the optimal solution in ${targetLanguage}.`,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/png;base64,${base64Data}`,
                    },
                  },
                ],
              },
            ],
          }),
          signal: this.currentAbortController.signal,
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision API Error (${response.status}): ${errorText}`);
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

  private parseSolution(markdown: string): VisionSolution {
    // Extract code block
    const codeMatch = markdown.match(/```(?:\w+)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : '';

    // Extract time & space complexity
    const timeMatch = markdown.match(/Time Complexity:?\*\*?\s*O\(([^)]+)\)/i);
    const spaceMatch = markdown.match(/Space Complexity:?\*\*?\s*O\(([^)]+)\)/i);

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
