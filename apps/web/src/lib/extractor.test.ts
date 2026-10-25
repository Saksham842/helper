import { describe, it, expect, vi } from 'vitest';

// Define mocks at top-level scope
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockImplementation(async ({ buffer }: { buffer: Buffer }) => {
      if (buffer.toString().includes('fail')) {
        throw new Error('Corrupt DOCX document');
      }
      return { value: 'Senior Engineer at Acme Corp\n\nExperience with distributed systems.' };
    }),
  },
}));

vi.mock('pdf-parse', () => {
  const mockFn = vi.fn().mockImplementation(async (buffer: Buffer) => {
    if (buffer.toString().includes('corrupt')) {
      throw new Error('Corrupt PDF stream');
    }
    return { text: 'Candidate Resume\nSkills: TypeScript, Next.js, Electron' };
  });
  return {
    default: mockFn,
    PDFParse: mockFn,
  };
});

import { normalizeExtractedText, extractTextFromBuffer } from './extractor';

// --- normalizeExtractedText ---
describe('normalizeExtractedText', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeExtractedText('')).toBe('');
  });

  it('strips null bytes and non-printable control characters', () => {
    const raw = 'Hello\x00World\x01\x08End';
    expect(normalizeExtractedText(raw)).toBe('HelloWorldEnd');
  });

  it('collapses excessive whitespace into single spaces', () => {
    const raw = 'Hello   \t   World';
    expect(normalizeExtractedText(raw)).toBe('Hello World');
  });

  it('normalizes CRLF to LF', () => {
    const raw = 'Line1\r\nLine2\r\nLine3';
    expect(normalizeExtractedText(raw)).toBe('Line1\nLine2\nLine3');
  });

  it('collapses 3+ consecutive newlines into 2', () => {
    const raw = 'Para1\n\n\n\nPara2';
    expect(normalizeExtractedText(raw)).toBe('Para1\n\nPara2');
  });

  it('preserves section headers separated by double newlines', () => {
    const raw = 'EXPERIENCE\n\nSoftware Engineer at Acme\n\nEDUCATION\n\nB.Tech CS';
    const result = normalizeExtractedText(raw);
    expect(result).toContain('EXPERIENCE');
    expect(result).toContain('EDUCATION');
    expect(result).toContain('Software Engineer at Acme');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeExtractedText('   hello world   ')).toBe('hello world');
  });
});

// --- extractTextFromBuffer (DOCX via mammoth mock) ---
describe('extractTextFromBuffer - DOCX', () => {
  it('extracts text from a DOCX buffer via mammoth', async () => {
    const fakeBuffer = Buffer.from('fake-docx-content');
    const result = await extractTextFromBuffer(
      fakeBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'resume.docx'
    );

    expect(result.text).toContain('Senior Engineer at Acme Corp');
    expect(result.charCount).toBeGreaterThan(0);
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it('rethrows with descriptive message when mammoth fails', async () => {
    const corruptBuffer = Buffer.from('fail-docx');
    await expect(
      extractTextFromBuffer(
        corruptBuffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'resume.docx'
      )
    ).rejects.toThrow(/Failed to extract text from DOCX/);
  });
});

// --- extractTextFromBuffer (PDF) ---
describe('extractTextFromBuffer - PDF', () => {
  it('extracts text from a valid PDF buffer', async () => {
    const fakeBuffer = Buffer.from('%PDF-1.4 valid content');
    const result = await extractTextFromBuffer(fakeBuffer, 'application/pdf', 'resume.pdf');
    expect(result.text).toContain('Candidate Resume');
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it('rethrows with descriptive message when pdf-parse fails', async () => {
    const fakeBuffer = Buffer.from('%PDF-corrupt');
    await expect(
      extractTextFromBuffer(fakeBuffer, 'application/pdf', 'corrupted.pdf')
    ).rejects.toThrow(/Failed to extract text from PDF/);
  });
});
