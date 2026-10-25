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
 * Extract plain text from PDF or DOCX buffer
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
    try {
      // Dynamic import to handle SSR / Next.js edge bundling
      const pdfModule = await import('pdf-parse');
      const PDFParseClass = (pdfModule as any).PDFParse || (pdfModule as any).default?.PDFParse || (pdfModule as any).default;
      
      if (typeof PDFParseClass === 'function' && PDFParseClass.prototype?.getText) {
        const parser = new PDFParseClass({ data: buffer });
        const res = await parser.getText();
        rawText = res?.text || '';
      } else if (typeof (pdfModule as any) === 'function') {
        const res = await (pdfModule as any)(buffer);
        rawText = res?.text || '';
      } else if (typeof (pdfModule as any).default === 'function') {
        const res = await (pdfModule as any).default(buffer);
        rawText = res?.text || '';
      } else {
        throw new Error('Unsupported pdf-parse export structure');
      }
    } catch (err: any) {
      console.error('[Extractor] PDF parsing error:', err);
      throw new Error(`Failed to extract text from PDF: ${err?.message || 'Unknown error'}`);
    }
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
