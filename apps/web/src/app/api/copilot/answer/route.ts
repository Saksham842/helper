import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { question, history = [], targetRole, customInstructions, resumeText } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    const fallbackKey = process.env.GROQ_API_KEY_FALLBACK;
    if (!apiKey && !fallbackKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const systemPrompt = `You are GhostPilot, an undetectable, ultra-low latency real-time interview copilot.
The candidate is actively speaking to an interviewer on a live call.
Your output will be rendered on a stealth HUD that the candidate glances at while speaking.

CRITICAL INSTRUCTIONS:
1. Ultra-Scannable: Format answers in 3-4 concise bullet points maximum.
2. Bold Key Terms: Bold core technical keywords, metrics, or architecture patterns (**like this**).
3. First-Person Voice: Speak from the candidate's perspective ("I implemented...", "In my past work with...").
4. Tailor to Resume: Weave in relevant technologies and achievements from the candidate's resume context.
5. No Fluff: Zero introductory or concluding remarks. Jump straight to the bullets.`;

    let userPrompt = '';
    if (targetRole) userPrompt += `Target Role: ${targetRole}\n`;
    if (customInstructions) userPrompt += `Custom Instructions: ${customInstructions}\n`;
    if (resumeText) userPrompt += `\nCandidate Resume Highlights:\n${resumeText.slice(0, 5000)}\n`;
    if (history.length > 0) {
      userPrompt += `\nRecent Conversation Context:\n${history
        .map((h: any) => `${h.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${h.text}`)
        .join('\n')}\n`;
    }
    userPrompt += `\nQuestion to Answer:\n"${question}"`;

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
            console.warn('[Copilot Answer] Groq key rate limited (429), switching to fallback key...');
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
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
        })
      );
    } catch (primaryErr) {
      console.warn('[Copilot Answer] Primary model failed, trying fallback model:', primaryErr);
      stream = await executeWithKeyFallback((groq) =>
        groq.chat.completions.create({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
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
    console.error('[Copilot Answer Route Error]:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
