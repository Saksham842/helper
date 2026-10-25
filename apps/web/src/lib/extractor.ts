import mammoth from 'mammoth';

export interface ExtractedDocument {
  text: string;
  charCount: number;
  wordCount: number;
}

/**
 * Clean and normalize extracted text from PDF/DOCX
 */
export function normalizeExtractedText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove null bytes and non-printable control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize excessive horizontal whitespace while preserving single spaces
    .replace(/[ \t]+/g, ' ')
    // Collapse 3+ consecutive newlines into 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Regex-based fallback — mirrors IntervieHire's resume_parser.py pattern:
 *   strings = re.findall(rb"[a-zA-Z0-9\s\.,;:!?\-\'\"]{4,}", content)
 * Extracts printable ASCII runs of 4+ chars directly from the raw binary.
 */
function extractPdfTextFallback(buffer: Buffer): string {
  const content = buffer.toString('binary');
  // Match printable ASCII sequences of 4+ characters (same regex as the Python fallback)
  const matches = content.match(/[a-zA-Z0-9 .,;:!?\-'"]{4,}/g) || [];
  return matches.slice(0, 2000).join(' ');
}

/**
 * Extract plain text from a PDF buffer using `unpdf`.
 *
 * `unpdf` ships its own bundled pdfjs distribution and does NOT depend on
 * the system's pdfjs-dist package, so it is completely safe to use inside
 * Next.js 15 App Router server routes without any Webpack bundling errors.
 * This mirrors the pypdf → regex-fallback pattern in IntervieHire's
 * backend/app/utils/resume_parser.py.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Primary: unpdf (bundled pdfjs — zero Webpack conflicts)
  try {
    const { extractText } = await import('unpdf');
    const uint8 = new Uint8Array(buffer);
    const result = await extractText(uint8, { mergePages: true });
    const text = (result as any)?.text ?? '';
    if (text.trim().length > 0) {
      console.log(`[Extractor] unpdf extracted ${text.length} chars`);
      return text;
    }
    console.warn('[Extractor] unpdf returned empty text, falling back to regex');
  } catch (err: any) {
    console.warn('[Extractor] unpdf failed, falling back to regex:', err?.message);
  }

  // Fallback: raw binary regex (no dependencies)
  console.log('[Extractor] Using regex fallback for PDF');
  return extractPdfTextFallback(buffer);
}

/**
 * Extract plain text from PDF or DOCX buffer.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string = ''
): Promise<ExtractedDocument> {
  const isPdf =
    mimeType === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf');

  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    fileName.toLowerCase().endsWith('.docx') ||
    fileName.toLowerCase().endsWith('.doc');

  let rawText = '';

  if (isPdf) {
    rawText = await extractPdfText(buffer);
  } else if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value || '';
    } catch (err: any) {
      console.error('[Extractor] DOCX parsing error:', err);
      throw new Error(`Failed to extract text from DOCX: ${err?.message || 'Unknown error'}`);
    }
  } else {
    // Fallback: try reading as UTF-8 string if it's plain text or markdown
    rawText = buffer.toString('utf-8');
  }

  const cleanText = normalizeExtractedText(rawText);
  const words = cleanText.length > 0 ? cleanText.split(/\s+/).filter(Boolean).length : 0;

  return {
    text: cleanText,
    charCount: cleanText.length,
    wordCount: words,
  };
}
