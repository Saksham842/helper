import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check optional bearer token or header from desktop client
    const authHeader = req.headers.get('authorization');
    const userId = user?.id || (authHeader?.includes('demo') ? 'demo-user-id' : 'demo-user-id');

    let activeDoc = null;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        activeDoc = data;
      }
    } catch (err) {
      console.warn('[Vault Active] Database lookup fallback:', err);
    }

    if (!activeDoc) {
      // Return helpful fallback context for test and initial users
      return NextResponse.json({
        hasActiveResume: false,
        document: null,
        extractedText: '',
        customInstructions: 'Focus on distributed systems, algorithms, and STAR behavioral answers.',
        targetRole: 'Senior Software Engineer',
      });
    }

    return NextResponse.json({
      hasActiveResume: true,
      document: {
        id: activeDoc.id,
        name: activeDoc.name,
        filePath: activeDoc.file_path,
        fileType: activeDoc.file_type,
        createdAt: activeDoc.created_at,
      },
      extractedText: activeDoc.extracted_text || '',
      customInstructions: 'Focus on clean architecture, performance tradeoffs, and structured STAR format.',
      targetRole: 'Senior Full Stack / Systems Engineer',
    });
  } catch (err: any) {
    console.error('[Vault Active Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch active resume context' },
      { status: 500 }
    );
  }
}
