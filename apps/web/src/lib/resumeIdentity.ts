/**
 * Resume Identity & Experience Extraction Utilities
 * Ported and enhanced from IntervieHire's regex heuristic pipeline.
 * Runs 100% locally and synchronously with zero AI latency or cost.
 */

export interface ResumeIdentityResult {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  experienceYears: number | null;
  experienceSummary: string;
  source: 'explicit' | 'header' | 'email' | 'filename' | 'fallback';
}

/**
 * Normalizes raw resume text by stripping null bytes and consolidating whitespace
 */
export function normalizeResumeText(text: string = ''): string {
  return String(text)
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();
}

/**
 * Extracts candidate email address
 */
export function extractResumeEmail(text: string): string {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Extracts candidate phone number (10 to 15 digits)
 */
export function extractResumePhone(text: string): string {
  const candidates = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      return candidate.replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

/**
 * Extracts LinkedIn profile URL
 */
export function extractResumeLinkedIn(text: string): string {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s)]+/i);
  return match ? match[0].replace(/[.,;]+$/, '') : '';
}

/**
 * Cleans candidate name candidate strings
 */
function cleanNameLine(line: string = ''): string {
  return line
    .replace(/^[^A-Za-z]+|[^A-Za-z.' -]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats name in Title Case
 */
function normalizeCandidateName(name: string = ''): string {
  const cleaned = cleanNameLine(name);
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .map(part => {
      if (/^[A-Z]{2,}$/.test(part)) {
        return part.charAt(0) + part.slice(1).toLowerCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

/**
 * Validates if a string looks like a legitimate person's name
 */
function isLikelyPersonName(name: string = ''): boolean {
  const cleaned = cleanNameLine(name);
  if (!cleaned || cleaned.length < 4 || cleaned.length > 50) return false;
  if (/[0-9@:/\\]/.test(cleaned)) return false;

  const lower = cleaned.toLowerCase();
  const blocked = [
    'resume', 'curriculum vitae', 'cv', 'profile', 'summary', 'objective',
    'education', 'experience', 'employment', 'skills', 'projects', 'certifications',
    'contact', 'email', 'phone', 'mobile', 'address', 'linkedin', 'github',
    'developer', 'engineer', 'manager', 'executive', 'consultant', 'analyst',
    'full stack', 'frontend', 'backend', 'software', 'university', 'college',
    'bachelor', 'master', 'phd', 'lead', 'architect', 'visa', 'status'
  ];

  if (blocked.some(word => lower === word || lower.includes(`${word} `) || lower.includes(` ${word}`))) {
    return false;
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  return words.every(word => /^[A-Za-z][A-Za-z.'-]{1,}$/.test(word));
}

/**
 * Extracts candidate name from explicit label like "Name: John Doe"
 */
function extractExplicitResumeName(text: string): string {
  const patterns = [
    /(?:^|\n)\s*(?:name|full name|candidate name)\s*[:-]\s*([A-Za-z][A-Za-z.' -]{2,80})/i,
    /(?:^|\n)\s*(?:candidate)\s*[:-]\s*([A-Za-z][A-Za-z.' -]{2,80})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = cleanNameLine(match[1]);
      if (isLikelyPersonName(candidate)) return candidate;
    }
  }
  return '';
}

/**
 * Extracts candidate name from top 30 header lines of resume
 */
function extractHeaderResumeName(text: string): string {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 30);

  for (const line of lines) {
    const parts = line.split(/\s+[|]\s+|\s+-\s+|\s+--\s+/);
    for (const part of parts.slice(0, 2)) {
      const candidate = cleanNameLine(part);
      if (isLikelyPersonName(candidate)) return candidate;
    }
  }
  return '';
}

/**
 * Infers candidate name from email local part (e.g. john.doe@gmail.com -> John Doe)
 */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] || '';
  const parts = local
    .replace(/[0-9]+/g, ' ')
    .split(/[._+-]+/)
    .map(part => part.trim())
    .filter(part => part.length > 1 && !['info', 'contact', 'mail', 'hello', 'admin', 'resume', 'cv'].includes(part.toLowerCase()));

  if (parts.length < 2) return '';
  return normalizeCandidateName(parts.slice(0, 3).join(' '));
}

/**
 * Extracts candidate name from file name (e.g. "Jane_Doe_Resume_2024.pdf" -> Jane Doe)
 */
export function extractCandidateNameFromFilename(filename: string = ''): string {
  let name = filename.replace(/\.[^/.]+$/, '');
  name = name.replace(/[_\-.]/g, ' ');
  name = name.replace(/\b(resume|cv|hiring|job|developer|executive|profile|senior|junior|doc|pdf|en|final|v1|v2)\b/gi, '');
  name = name.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return name.trim();
}

/**
 * Extracts estimated total experience years from resume text
 */
export function extractExperienceYears(text: string): { years: number | null; summary: string } {
  // 1. Direct explicit phrases like "5+ years of experience", "over 7 years in software"
  const explicitMatches = [
    ...text.matchAll(/(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:professional|industry|relevant|software|hands-on))?\s*experience/gi),
    ...text.matchAll(/experience\s*[:-]?\s*(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)/gi),
    ...text.matchAll(/(?:over|around|more than)\s+(\d{1,2})\s*(?:years?|yrs?)/gi)
  ];

  for (const m of explicitMatches) {
    const val = parseFloat(m[1]);
    if (val >= 0.5 && val <= 40) {
      return {
        years: Math.round(val * 10) / 10,
        summary: `${val}+ years (explicitly mentioned)`
      };
    }
  }

  // 2. Year ranges in work history (e.g. 2018 - 2024, 2019 - Present)
  const currentYear = new Date().getFullYear();
  const yearRangeRegex = /\b(199\d|20[0-2]\d)\s*(?:[-–—]|to)\s*(199\d|20[0-2]\d|Present|Current|Now)\b/gi;
  const ranges: { start: number; end: number }[] = [];

  let match;
  while ((match = yearRangeRegex.exec(text)) !== null) {
    const start = parseInt(match[1], 10);
    const endStr = match[2];
    const end = /present|current|now/i.test(endStr) ? currentYear : parseInt(endStr, 10);
    if (start <= end && start >= 1990 && end <= currentYear + 1) {
      ranges.push({ start, end });
    }
  }

  if (ranges.length > 0) {
    // Merge overlapping/concurrent year ranges
    ranges.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    for (const r of ranges) {
      if (merged.length === 0 || merged[merged.length - 1].end < r.start) {
        merged.push({ ...r });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
      }
    }

    let totalSpanYears = 0;
    for (const span of merged) {
      totalSpanYears += (span.end - span.start);
    }

    if (totalSpanYears >= 1 && totalSpanYears <= 40) {
      return {
        years: totalSpanYears,
        summary: `~${totalSpanYears} years (calculated from career timeline: ${merged[0].start} - ${merged[merged.length - 1].end})`
      };
    }
  }

  return { years: null, summary: 'Not detected' };
}

/**
 * Master identity extraction function
 */
export function extractResumeIdentity(text: string = '', filename: string = ''): ResumeIdentityResult {
  const cleanText = normalizeResumeText(text);
  const email = extractResumeEmail(cleanText);
  const phone = extractResumePhone(cleanText);
  const linkedin = extractResumeLinkedIn(cleanText);
  const experience = extractExperienceYears(cleanText);

  const explicitName = extractExplicitResumeName(cleanText);
  const headerName = explicitName || extractHeaderResumeName(cleanText);
  const emailName = email ? nameFromEmail(email) : '';
  const filenameName = filename ? extractCandidateNameFromFilename(filename) : '';

  let name = '';
  let source: ResumeIdentityResult['source'] = 'fallback';

  if (explicitName) {
    name = normalizeCandidateName(explicitName);
    source = 'explicit';
  } else if (headerName) {
    name = normalizeCandidateName(headerName);
    source = 'header';
  } else if (emailName) {
    name = normalizeCandidateName(emailName);
    source = 'email';
  } else if (filenameName && isLikelyPersonName(filenameName)) {
    name = normalizeCandidateName(filenameName);
    source = 'filename';
  } else {
    name = filenameName || 'Candidate';
    source = 'fallback';
  }

  return {
    name,
    email,
    phone,
    linkedin,
    experienceYears: experience.years,
    experienceSummary: experience.summary,
    source,
  };
}
