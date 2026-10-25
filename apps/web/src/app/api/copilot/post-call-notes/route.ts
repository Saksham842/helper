import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const { transcript = [], sessionTitle } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        summary: 'Call completed successfully. Transcript recorded.',
        keyTakeaways: ['Transcript captured in session archive'],
      });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt =
      'You are an executive assistant and technical interviewer synthesizing post-call interview notes. Output a JSON object with "summary", "strengths", "improvements", and "actionItems".';

    const userPrompt = `Session: ${sessionTitle || 'Technical Interview'}
Transcript:
${transcript.map((t: any) => `${t.speaker}: ${t.text}`).join('\n')}`;

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });
    } catch {
      completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });
    }

    const notes = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return NextResponse.json(notes);
  } catch (err: any) {
    console.error('[Post Call Notes Route Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to generate post-call notes' }, { status: 500 });
  }
}
