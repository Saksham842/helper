import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

interface MockRespondPayload {
  track: string;
  role: string;
  difficulty: string;
  history: Array<{ speaker: 'interviewer' | 'candidate'; text: string }>;
  resumeText?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: MockRespondPayload = await req.json();
    const { track, role, difficulty, history, resumeText } = body;

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      // Deterministic realistic simulated technical interviewer responses
      const simulatedResponses: Record<string, string[]> = {
        'System Design & Architecture': [
          "That's a sound architectural foundation. How would you handle hot partition keys if 80% of read traffic suddenly concentrates on 1% of the database shards?",
          "Good intuition on caching. If the cache nodes experience a network partition, what consistency model would you choose between AP and CP, and why?",
          "How would you ensure exactly-once processing semantics across your message queues and downstream worker pools without introducing unbounded latency?",
          "Let's wrap up this track. Can you summarize the end-to-end SLA, estimated cost, and single point of failure in this design?",
        ],
        'Frontend & Full-Stack': [
          "Great explanation. In React 19, how does concurrent rendering interact with Suspense boundaries during heavy client-side state transitions?",
          "How would you optimize the Core Web Vitals (specifically INP and LCP) on a page rendering dynamic, high-frequency stock ticker updates?",
          "Walk me through how you would architect a resilient offline-first data layer with IndexedDB and background Service Worker sync.",
          "How would you mitigate Cross-Site Scripting (XSS) in an application rendering user-supplied markdown and rich text widgets?",
        ],
        'Algorithms & Problem Solving': [
          "Good approach. What is the precise time and space complexity of your solution, and can you optimize the extra auxiliary space to O(1)?",
          "What edge cases could cause this algorithm to degrade to quadratic time, and how would you restructure the traversal to prevent it?",
          "Could you walk me through how a sliding window or monotonic queue would improve the time complexity for streaming inputs?",
          "Excellent breakdown. Let's analyze how this algorithm scales if the input dataset exceeds available RAM by 10x.",
        ],
        'Behavioral & Leadership': [
          "Thank you for sharing that experience. Can you tell me about a time when you strongly disagreed with a tech lead's architectural decision and how you handled the disagreement?",
          "Tell me about a project that fell behind schedule. What proactive steps did you take to re-align stakeholders and deliver the critical path?",
          "How do you approach mentoring junior engineers when their code contributions consistently fail quality gates or unit tests?",
          "Describe a high-stakes production incident you led resolution for. What was the root cause, and how did you prevent recurrence in the post-mortem?",
        ],
      };

      const trackList = simulatedResponses[track] || simulatedResponses['System Design & Architecture'];
      const questionIndex = Math.min(
        Math.floor(history.length / 2),
        trackList.length - 1
      );
      const nextQuestion = trackList[questionIndex];

      return NextResponse.json({
        nextQuestion,
        evaluation: 'Candidate response clearly addressed core prompt elements with structured technical reasoning.',
      });
    }

    // Call Groq Llama with primary model and fast fallback
    const groq = new Groq({ apiKey });

    const systemPrompt = `You are an elite, realistic technical interviewer conducting a mock interview for a ${difficulty} ${role} in "${track}".${
      resumeText ? `\nCandidate Resume Highlights:\n${resumeText.slice(0, 3000)}` : ''
    }

Based on the candidate's last answer, formulate your next logical follow-up question or probe.
Keep it natural, professional, and concise (1-2 sentences maximum) so it sounds like spoken dialogue.
Do NOT include pleasantries or meta-commentary. Output ONLY the interviewer's spoken words.`;

    const userContent = `Recent conversation:\n${history
      .map((m) => `${m.speaker === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
      .join('\n')}`;

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        max_tokens: 250,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      });
    } catch (primaryErr: any) {
      console.warn('[Mock Respond] Primary model failed, trying fast fallback:', primaryErr?.message);
      completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        max_tokens: 250,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      });
    }

    const nextQuestion =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Can you walk me through the trade-offs of that approach?";

    return NextResponse.json({
      nextQuestion,
      evaluation: 'Live Groq Llama adaptive response generated.',
    });
  } catch (err: any) {
    console.error('[Mock Respond Error]:', err);
    return NextResponse.json(
      { nextQuestion: "That's an interesting perspective. Could you elaborate on how you would measure success in production?" },
      { status: 200 }
    );
  }
}
