import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || 'demo-user-id';

    // 1. Fetch Profile
    let profile: any = null;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      profile = data;
    } catch {
      // fallback
    }

    // 2. Fetch Documents (Resume Vault)
    let documents: any[] = [];
    try {
      const { data } = await supabase.from('documents').select('*').eq('user_id', userId);
      documents = data || [];
    } catch {
      // fallback
    }

    // 3. Fetch Sessions
    let sessions: any[] = [];
    try {
      const { data } = await supabase.from('sessions').select('*').eq('user_id', userId);
      sessions = data || [];
    } catch {
      // fallback
    }

    // 4. Fetch Transcripts
    let transcripts: any[] = [];
    try {
      const { data } = await supabase.from('transcripts').select('*').eq('user_id', userId);
      transcripts = data || [];
    } catch {
      // fallback
    }

    // 5. Fetch AI Responses
    let aiResponses: any[] = [];
    try {
      const { data } = await supabase.from('ai_responses').select('*').eq('user_id', userId);
      aiResponses = data || [];
    } catch {
      // fallback
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'GhostPilot Real-Time AI Copilot',
      complianceNotice: 'DPDP Act 2023 & GDPR Article 20 Data Portability Export',
      user: {
        id: userId,
        email: user?.email || 'user@local.domain',
        profile: profile || {
          id: userId,
          fullName: 'Candidate',
          role: 'Software Engineer',
        },
      },
      documentsVault: documents,
      interviewSessions: sessions,
      speechTranscripts: transcripts,
      aiSolutionsAndEvaluations: aiResponses,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="ghostpilot_user_data_${userId.slice(0, 8)}.json"`,
      },
    });
  } catch (err: any) {
    console.error('[Export Data Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate data export' },
      { status: 500 }
    );
  }
}
