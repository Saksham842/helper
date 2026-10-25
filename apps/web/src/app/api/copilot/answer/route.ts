import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { question, history = [], targetRole, customInstructions, resumeText } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

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

    let stream;
    try {
      stream = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
      });
    } catch (primaryErr) {
      console.warn('[Copilot Answer] Primary model failed, trying fallback:', primaryErr);
      stream = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
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
    console.error('[Copilot Answer Route Error]:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
