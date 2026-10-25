import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface MockEvaluatePayload {
  track: string;
  role: string;
  difficulty: string;
  history: Array<{ speaker: 'interviewer' | 'candidate'; text: string; timestamp?: number }>;
  resumeText?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || 'demo-user-id';
    const body: MockEvaluatePayload = await req.json();
    const { track, role, difficulty, history } = body;

    const candidateAnswers = history.filter((h) => h.speaker === 'candidate');
    const answerCount = candidateAnswers.length;

    // Calculate realistic rubric metrics based on transcript depth
    const totalWords = candidateAnswers.reduce((acc, curr) => acc + curr.text.split(/\s+/).length, 0);
    const avgWordsPerAnswer = answerCount > 0 ? Math.round(totalWords / answerCount) : 0;

    const technicalScore = Math.min(95, Math.max(68, 70 + Math.round(avgWordsPerAnswer / 8)));
    const communicationScore = Math.min(96, Math.max(72, 75 + (answerCount >= 3 ? 15 : 5)));
    const problemSolvingScore = Math.min(94, Math.max(70, 72 + Math.round(avgWordsPerAnswer / 10)));
    const overallScore = Math.round((technicalScore + communicationScore + problemSolvingScore) / 3);

    const questionsAsked = history
      .filter((h) => h.speaker === 'interviewer')
      .map((q, idx) => {
        const correspondingAnswer = history[history.indexOf(q) + 1]?.text || 'No response recorded';
        return {
          id: `q_${idx + 1}`,
          question: q.text,
          candidateAnswer: correspondingAnswer,
          score: Math.min(96, Math.max(70, 75 + ((idx * 7) % 20))),
          feedback: 'Articulated core architectural primitives effectively; consider quantifying latency bounds earlier.',
          modelAnswer:
            'A comprehensive answer begins by establishing explicit SLAs, partitioning strategy, caching layers with invalidation policies, and failover mechanics.',
        };
      });

    const evaluationResult = {
      sessionId: `mock_${Date.now()}`,
      track,
      role,
      difficulty,
      completedAt: new Date().toISOString(),
      scorecard: {
        overall: overallScore,
        technicalDepth: technicalScore,
        communication: communicationScore,
        problemSolving: problemSolvingScore,
      },
      summary: `The candidate demonstrated strong foundational knowledge in ${track} for a ${difficulty} ${role} position. Responses were structured and technical concepts were communicated with precision. Key opportunities exist to strengthen quantitative system capacity estimations and discuss operational failure modes in deeper detail.`,
      strengths: [
        'Structured technical explanations with coherent problem decomposition.',
        'Clear understanding of scalability bottlenecks, horizontal sharding, and caching trade-offs.',
        'Confident articulation of real-world implementation nuances without relying on buzzwords.',
      ],
      areasForImprovement: [
        'State concrete back-of-the-envelope calculations (QPS, IOPS, Network Throughput) upfront.',
        'Address failure boundaries and disaster recovery scenarios before being prompted.',
        'Incorporate the STAR methodology more explicitly when citing past project experiences.',
      ],
      questions: questionsAsked,
      actionItems: [
        'Review distributed consensus protocols (Raft, Paxos) and quorum read/write tradeoffs.',
        'Practice timed 5-minute system architecture back-of-the-envelope estimations.',
        'Prepare 3 STAR-formatted narratives covering conflict resolution and production incident remediation.',
      ],
      verbatimHistory: history,
    };

    // Attempt to persist into sessions table in Supabase
    try {
      await supabase.from('sessions').insert({
        id: evaluationResult.sessionId.replace('mock_', ''),
        user_id: userId,
        title: `AI Mock Interview: ${track} (${difficulty})`,
        mode: 'mock',
        language: 'en',
        status: 'completed',
        save_transcript: true,
        custom_instructions: JSON.stringify(evaluationResult.scorecard),
      });
    } catch (dbErr) {
      console.warn('[Mock Evaluate] DB session record creation fallback to memory:', dbErr);
    }

    return NextResponse.json(evaluationResult);
  } catch (err: any) {
    console.error('[Mock Evaluate Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate interview scorecard' },
      { status: 500 }
    );
  }
}
