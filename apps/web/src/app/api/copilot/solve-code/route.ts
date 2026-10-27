import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, targetLanguage = 'C++' } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    const fallbackKey = process.env.GROQ_API_KEY_FALLBACK;
    if (!apiKey && !fallbackKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const cleanBase64 = (imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');

    const langFence = targetLanguage.toLowerCase() === 'c++' ? 'cpp' : targetLanguage.toLowerCase();

    const systemPrompt = `You are a world-champion competitive programmer and technical interview expert.
A coding problem (LeetCode, HackerRank, CoderPad, or IDE) is displayed on screen.
Your job is to provide an undetectable, executive-grade, and complete solution in ${targetLanguage}.
You MUST structure your response strictly in this exact 5-tier sequence:

### 1. Intuition / What to Say Out Loud
- [3–4 natural, conversational bullet points written in first-person speech that the candidate reads verbatim to the interviewer]

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
- **Edge Cases:** [2-3 key edge cases to mention]`;

    const userPrompt = `Analyze the coding problem on my screen and provide the optimal and complete solution in ${targetLanguage} with 1. intuition, 2. brute force approach, 3. optimal approach concept, 4. complete code, and 5. complexity analysis with edge cases.`;

    async function executeWithKeyFallback<T>(fn: (groqClient: Groq) => Promise<T>): Promise<T> {
      const keys = [apiKey, fallbackKey].filter(Boolean) as string[];
      let lastErr: any;
      for (const k of keys) {
        try {
          const client = new Groq({ apiKey: k });
          return await fn(client);
        } catch (err: any) {
          lastErr = err;
          if (keys.length > 1 && (err?.status === 429 || err?.message?.includes('rate_limit') || err?.message?.includes('429'))) {
            console.warn('[Copilot Solve Code] Groq key rate limited (429), switching to fallback key...');
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    }

    let stream;
    try {
      stream = await executeWithKeyFallback((groq) =>
        groq.chat.completions.create({
          model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
          max_tokens: 2500,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${cleanBase64}`,
                  },
                },
              ],
            },
          ],
          stream: true,
        })
      );
    } catch (primaryErr) {
      console.warn('[Copilot Solve Code] Primary vision model failed, trying fallback model:', primaryErr);
      stream = await executeWithKeyFallback((groq) =>
        groq.chat.completions.create({
          model: 'qwen/qwen3.8-27b',
          max_tokens: 2500,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${cleanBase64}`,
                  },
                },
              ],
            },
          ],
          stream: true,
        })
      );
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (streamErr) {
          controller.error(streamErr);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('[Copilot Solve Code Route Error]:', err);
    const status = err?.status === 429 || err?.message?.includes('rate_limit') ? 429 : 500;
    return NextResponse.json(
      {
        error:
          err?.message ||
          'Rate limit reached on Groq Vision API. Note: Keys under the same Groq organization share a daily token limit. To resolve, use an API key from a separate Groq account.',
      },
      { status }
    );
  }
}
