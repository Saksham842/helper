import { describe, it, expect } from 'vitest';

// Test upload validation logic extracted for unit testability
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateUpload(fileSize: number, mimeType: string, fileName: string): { valid: boolean; error?: string } {
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds maximum limit of 10MB' };
  }

  const isPdf = fileName.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';
  const isDocx =
    fileName.toLowerCase().endsWith('.docx') ||
    fileName.toLowerCase().endsWith('.doc') ||
    mimeType.includes('word');

  if (!isPdf && !isDocx) {
    return { valid: false, error: 'Unsupported file type. Only PDF and DOCX documents are accepted.' };
  }

  return { valid: true };
}

function buildStoragePath(userId: string, timestamp: number, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${timestamp}_${sanitized}`;
}

describe('vault/upload - file validation', () => {
  it('rejects files larger than 10MB', () => {
    const result = validateUpload(11 * 1024 * 1024, 'application/pdf', 'resume.pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('accepts files exactly at 10MB limit', () => {
    const result = validateUpload(10 * 1024 * 1024, 'application/pdf', 'resume.pdf');
    expect(result.valid).toBe(true);
  });

  it('accepts PDF files by MIME type', () => {
    const result = validateUpload(1024, 'application/pdf', 'resume.pdf');
    expect(result.valid).toBe(true);
  });

  it('accepts PDF files by extension even without correct MIME', () => {
    const result = validateUpload(1024, 'application/octet-stream', 'resume.pdf');
    expect(result.valid).toBe(true);
  });

  it('accepts DOCX files by MIME type', () => {
    const result = validateUpload(1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'resume.docx');
    expect(result.valid).toBe(true);
  });

  it('accepts DOCX files by extension', () => {
    const result = validateUpload(1024, 'application/octet-stream', 'resume.docx');
    expect(result.valid).toBe(true);
  });

  it('rejects unsupported file types (.txt)', () => {
    const result = validateUpload(1024, 'text/plain', 'resume.txt');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported file type');
  });

  it('rejects .jpg image files', () => {
    const result = validateUpload(512 * 1024, 'image/jpeg', 'photo.jpg');
    expect(result.valid).toBe(false);
  });
});

describe('vault/upload - storage path generation', () => {
  it('generates path in format userId/timestamp_filename', () => {
    const path = buildStoragePath('user-123', 1700000000000, 'my-resume.pdf');
    expect(path).toBe('user-123/1700000000000_my-resume.pdf');
  });

  it('sanitizes special characters in filename', () => {
    const path = buildStoragePath('user-123', 1700000000000, 'My Resume (2024).pdf');
    expect(path).toBe('user-123/1700000000000_My_Resume__2024_.pdf');
  });

  it('preserves dots and hyphens in filename', () => {
    const path = buildStoragePath('user-abc', 1700000000000, 'resume-v2.0.docx');
    expect(path).toBe('user-abc/1700000000000_resume-v2.0.docx');
  });
});
