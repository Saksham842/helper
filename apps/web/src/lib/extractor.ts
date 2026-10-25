import { createRequire } from 'module';
import { join } from 'path';
import mammoth from 'mammoth';

// Use process.cwd()-based require so this works in both ESM and CJS
// Next.js App Router server routes — import.meta.url is unreliable in CJS
// webpack bundles, so we anchor createRequire to the project root instead.
const _require = createRequire(join(process.cwd(), 'package.json'));

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
 * Pure-JS fallback: extract raw text from a PDF buffer by parsing
 * content stream operators (BT/ET/Tj/TJ/') without pdfjs.
 * Handles basic ASCII and Latin-1 encoded PDF text streams.
 */
function extractPdfTextFallback(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const lines: string[] = [];

  // Match everything between BT and ET (text blocks)
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let block: RegExpExecArray | null;

  while ((block = btEtRegex.exec(content)) !== null) {
    const chunk = block[1];
    // Extract Tj (single string): (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = tjRegex.exec(chunk)) !== null) {
      lines.push(m[1]);
    }
    // Extract TJ (array): [(text) n (text2) ...] TJ
    const tjArrRegex = /\[([\s\S]*?)\]\s*TJ/g;
    while ((m = tjArrRegex.exec(chunk)) !== null) {
      const inner = m[1];
      const parts: string[] = [];
      const partRegex = /\(([^)]*)\)/g;
      let p: RegExpExecArray | null;
      while ((p = partRegex.exec(inner)) !== null) {
        parts.push(p[1]);
      }
      if (parts.length > 0) lines.push(parts.join(''));
    }
    // Handle ' operator (move to next line + show string)
    const quoteRegex = /\(([^)]*)\)\s*'/g;
    while ((m = quoteRegex.exec(chunk)) !== null) {
      lines.push(m[1]);
    }
  }

  // Unescape basic PDF string escape sequences
  return lines
    .join(' ')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')');
}

/**
 * Extract plain text from PDF or DOCX buffer.
 * Uses createRequire so that pdf-parse is loaded via native Node require
 * and is NEVER bundled through Webpack (which causes the
 * "Object.defineProperty called on non-object" crash in Next.js 15).
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
      // _require bypasses Webpack SSR entirely — pdf-parse is required
      // as a plain Node.js module, avoiding the pdfjs-dist ESM bootstrap
      // that crashes inside __webpack_require__.r on non-object namespaces.
      const pdfParse = _require('pdf-parse') as (
        dataBuffer: Buffer,
        options?: Record<string, unknown>
      ) => Promise<{ text: string; numpages: number }>;

      const result = await pdfParse(buffer, { max: 0 });
      rawText = result?.text || '';
    } catch (err: any) {
      console.warn('[Extractor] pdf-parse failed, using pure-JS fallback:', err?.message);
      // Pure-JS fallback: parses BT/ET/Tj/TJ operators directly
      try {
        rawText = extractPdfTextFallback(buffer);
      } catch (fallbackErr: any) {
        console.error('[Extractor] Pure-JS PDF fallback also failed:', fallbackErr);
        throw new Error(`Failed to extract text from PDF: ${err?.message || 'Unknown error'}`);
      }
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
