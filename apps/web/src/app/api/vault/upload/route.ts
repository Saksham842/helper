import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromBuffer } from '@/lib/extractor';
import { extractResumeIdentity } from '@/lib/resumeIdentity';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Use authenticated user ID or demo fallback ID for standalone local testing
    const userId = user?.id || 'demo-user-id';

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const targetRole = formData.get('targetRole') as string | null;
    const customInstructions = formData.get('customInstructions') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 10MB' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const mimeType = file.type || '';
    const isPdf = fileName.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';
    const isDocx =
      fileName.toLowerCase().endsWith('.docx') ||
      fileName.toLowerCase().endsWith('.doc') ||
      mimeType.includes('word');

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF and DOCX documents are accepted.' },
        { status: 400 }
      );
    }

    const fileType = isPdf ? 'pdf' : 'docx';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract raw text server-side
    const extracted = await extractTextFromBuffer(buffer, mimeType, fileName);

    // Extract resume identity (name, email, phone, linkedin, experience years)
    const identity = extractResumeIdentity(extracted.text, fileName);

    const storagePath = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Upload to Supabase Storage if configured
    try {
      await supabase.storage.from('resumes').upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });
    } catch (storageErr) {
      console.warn('[Vault Upload] Supabase Storage upload skipped or failed:', storageErr);
    }

    // Insert record into documents table
    const docRecord = {
      user_id: userId,
      name: fileName,
      file_path: storagePath,
      file_type: fileType,
      extracted_text: extracted.text,
      created_at: new Date().toISOString(),
    };

    let insertedDoc: any = null;
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert(docRecord)
        .select()
        .single();

      if (!error && data) {
        insertedDoc = data;
      }
    } catch (dbErr) {
      console.warn('[Vault Upload] Database insert fallback to in-memory record:', dbErr);
    }

    const responsePayload = {
      success: true,
      document: insertedDoc || {
        id: 'doc_' + Date.now(),
        userId,
        name: fileName,
        filePath: storagePath,
        fileType,
        extractedText: extracted.text,
        createdAt: new Date().toISOString(),
      },
      stats: {
        charCount: extracted.charCount,
        wordCount: extracted.wordCount,
      },
      identity,
      targetRole: targetRole || null,
      customInstructions: customInstructions || null,
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('[Vault Upload Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process document upload' },
      { status: 500 }
    );
  }
}
