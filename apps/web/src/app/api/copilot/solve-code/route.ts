import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, targetLanguage = 'Python' } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const cleanBase64 = (imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
    const groq = new Groq({ apiKey });

    const systemPrompt = `You are a world-champion competitive programmer and technical interview expert.
A coding problem (LeetCode, HackerRank, CoderPad, or system diagram) is displayed on screen.
Your job is to provide an undetectable, executive-grade solution optimized for live interviews.
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

### Edge Cases
- [Edge case 1]
- [Edge case 2]`;

    const userPrompt = `Analyze the coding problem on my screen and provide the optimal solution in ${targetLanguage}.`;

    let stream;
    try {
      stream = await groq.chat.completions.create({
        model: process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview',
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
      });
    } catch (primaryErr) {
      console.warn('[Copilot Solve Code] Primary vision model failed, trying fallback:', primaryErr);
      stream = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
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
      });
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
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
