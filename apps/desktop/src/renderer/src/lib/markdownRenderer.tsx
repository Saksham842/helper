/**
 * Shared zero-dependency markdown → JSX renderer with syntax highlighting.
 * Used by VisionSolutionCard and AIAnswerCard.
 */
import React from 'react';

// ─── Inline types ─────────────────────────────────────────────────────────────

type InlinePart =
  | { t: 'text'; v: string }
  | { t: 'bold'; v: string }
  | { t: 'italic'; v: string }
  | { t: 'code'; v: string };

// ─── Block types ──────────────────────────────────────────────────────────────

export type MDNode =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'bullet'; parts: InlinePart[] }
  | { kind: 'numbered'; n: number; parts: InlinePart[] }
  | { kind: 'code'; lang: string; body: string }
  | { kind: 'hr' }
  | { kind: 'blank' }
  | { kind: 'para'; parts: InlinePart[] };

// ─── Inline parser ────────────────────────────────────────────────────────────

export function parseInline(raw: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) parts.push({ t: 'text', v: raw.slice(last, m.index) });
    if (m[0].startsWith('**')) parts.push({ t: 'bold', v: m[2] });
    else if (m[0].startsWith('*')) parts.push({ t: 'italic', v: m[3] });
    else parts.push({ t: 'code', v: m[4] });
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push({ t: 'text', v: raw.slice(last) });
  return parts;
}

// ─── Block parser ─────────────────────────────────────────────────────────────

export function parseMarkdown(md: string): MDNode[] {
  const lines = md.split('\n');
  const nodes: MDNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'text';
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        bodyLines.push(lines[i]);
        i++;
      }
      nodes.push({ kind: 'code', lang, body: bodyLines.join('\n') });
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) { nodes.push({ kind: 'h1', text: trimmed.slice(2) }); i++; continue; }
    if (trimmed.startsWith('## ')) { nodes.push({ kind: 'h2', text: trimmed.slice(3) }); i++; continue; }
    if (trimmed.startsWith('### ')) { nodes.push({ kind: 'h3', text: trimmed.slice(4) }); i++; continue; }
    if (/^---+$/.test(trimmed)) { nodes.push({ kind: 'hr' }); i++; continue; }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) {
      nodes.push({ kind: 'bullet', parts: parseInline(bulletMatch[1]) });
      i++;
      continue;
    }
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      nodes.push({ kind: 'numbered', n: parseInt(numMatch[1], 10), parts: parseInline(numMatch[2]) });
      i++;
      continue;
    }
    if (trimmed === '') { nodes.push({ kind: 'blank' }); i++; continue; }

    nodes.push({ kind: 'para', parts: parseInline(trimmed) });
    i++;
  }
  return nodes;
}

// ─── Syntax highlighter ───────────────────────────────────────────────────────

const KW_MAP: Record<string, string[]> = {
  python:     ['def','return','if','elif','else','for','while','in','not','and','or',
                'import','from','class','self','None','True','False','pass','break',
                'continue','lambda','with','as','try','except','raise','yield','is'],
  javascript: ['const','let','var','function','return','if','else','for','while','of',
                'class','new','import','export','from','default','null','undefined',
                'true','false','typeof','instanceof','async','await','break','continue','switch','case'],
  typescript: ['const','let','var','function','return','if','else','for','while','of',
                'class','new','import','export','from','default','null','undefined',
                'true','false','typeof','interface','type','async','await','break','continue','switch','case'],
  java:       ['public','private','protected','static','void','int','long','boolean','String',
                'return','if','else','for','while','new','class','import','null',
                'true','false','this','super','extends','implements','break','continue'],
  'c++':      ['int','long','bool','void','return','if','else','for','while','auto',
                'class','struct','new','delete','nullptr','true','false','const','break',
                'continue','include','using','namespace','std','public','private','vector','map'],
  go:         ['func','return','if','else','for','range','var','const','type','struct',
                'import','package','nil','true','false','make','new','append','len','map'],
};

const SYN = {
  keyword: '#c792ea',   // violet
  string:  '#c3e88d',   // green
  comment: '#546e7a',   // slate
  number:  '#f78c6c',   // orange
  plain:   '#cdd6f4',   // lavender
};

export function highlightCode(code: string, lang: string): React.ReactNode[] {
  const kws = new Set(KW_MAP[lang.toLowerCase()] || []);
  return code.split('\n').map((line, li) => {
    const isHashComment = ['python'].includes(lang.toLowerCase());
    const isSlashComment = ['javascript','typescript','java','c++','go'].includes(lang.toLowerCase());
    const commentIdx = isHashComment
      ? line.indexOf('#')
      : isSlashComment
      ? line.indexOf('//')
      : -1;

    const codePart   = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

    const segs: { color: string; text: string }[] = [];
    const tokRe = /"[^"]*"|'[^']*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b\w+\b|[^\w\s"'`]+|\s+/g;
    let m: RegExpExecArray | null;
    while ((m = tokRe.exec(codePart)) !== null) {
      const tok = m[0];
      if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith('`'))
        segs.push({ color: SYN.string, text: tok });
      else if (/^\d/.test(tok))
        segs.push({ color: SYN.number, text: tok });
      else if (kws.has(tok))
        segs.push({ color: SYN.keyword, text: tok });
      else
        segs.push({ color: SYN.plain, text: tok });
    }
    if (commentPart) segs.push({ color: SYN.comment, text: commentPart });

    return (
      <span key={li} style={{ display: 'block', minHeight: '1.4em' }}>
        {segs.map((s, si) => <span key={si} style={{ color: s.color }}>{s.text}</span>)}
      </span>
    );
  });
}

// ─── Inline renderer ──────────────────────────────────────────────────────────

export function renderInline(parts: InlinePart[]): React.ReactNode {
  return parts.map((p, i) => {
    if (p.t === 'bold')   return <strong key={i} style={{ color: '#fde68a', fontWeight: 700 }}>{p.v}</strong>;
    if (p.t === 'italic') return <em     key={i} style={{ color: '#93c5fd', fontStyle: 'italic' }}>{p.v}</em>;
    if (p.t === 'code') return (
      <code key={i} style={{
        background: 'rgba(139,92,246,0.18)', color: '#a78bfa',
        borderRadius: '4px', padding: '1px 5px',
        fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '11px',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap',
      }}>{p.v}</code>
    );
    return <span key={i} style={{ color: '#cbd5e1', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{p.v}</span>;
  });
}

// ─── Section header colours ───────────────────────────────────────────────────

export function sectionColor(text: string): string {
  const t = text.toLowerCase().replace(/^\d+[\s.)-]+\s*/, '');
  if (t.includes('what to say') || t.includes('intuition')) return '#38bdf8'; // sky / cyan
  if (t.includes('brute force'))                             return '#fbbf24'; // amber
  if (t.includes('optimal approach') || t.includes('concept')) return '#a78bfa'; // violet
  if (t.includes('code') || t.includes('solution'))          return '#34d399'; // emerald
  if (t.includes('complex') || t.includes('edge'))           return '#fb923c'; // orange
  if (t.includes('problem'))                                 return '#38bdf8'; // sky
  if (t.includes('dry') || t.includes('trace'))              return '#f472b6'; // pink
  if (t.includes('result') || t.includes('output'))          return '#4ade80'; // green
  return '#94a3b8';  // muted default
}

// ─── CodeBlock Component ───────────────────────────────────────────────────────

const CodeBlock: React.FC<{ body: string; lang: string }> = ({ body, lang }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: '6px',
        marginBottom: '8px',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        background: 'rgba(255, 255, 255, 0.02)',
        borderLeft: '2px solid rgba(56, 189, 248, 0.5)',
        borderRadius: '0 6px 6px 0',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '3px 8px',
          boxSizing: 'border-box',
          maxWidth: '100%',
        }}
      >
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            padding: '2px 7px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: copied ? '#34d399' : '#cbd5e1',
            fontSize: '9.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            flexShrink: 0,
            marginRight: '2px',
          }}
          title="Copy Code"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '6px 10px 8px 10px',
          overflowX: 'hidden',
          overflowY: 'visible',
          maxWidth: '100%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          boxSizing: 'border-box',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '11.5px',
          lineHeight: 1.65,
        }}
      >
        {highlightCode(body, lang)}
      </pre>
    </div>
  );
};

export const MarkdownView: React.FC<{ md: string; accentColor?: string }> = ({
  md,
  accentColor = '#6366f1',
}) => {
  const nodes = parseMarkdown(md);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '2px',
      overflowX: 'hidden',
      maxWidth: '100%',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
      boxSizing: 'border-box',
    }}>
      {nodes.map((node, i) => {
        switch (node.kind) {

          case 'h1':
          case 'h2': {
            const col = node.kind === 'h1' ? '#f1f5f9' : '#94a3b8';
            return (
              <div key={i} style={{ marginTop: i === 0 ? 0 : '12px', marginBottom: '3px' }}>
                <span style={{
                  fontSize: node.kind === 'h1' ? '13px' : '12px',
                  fontWeight: 800,
                  color: col,
                  letterSpacing: '0.02em',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                }}>{node.text}</span>
              </div>
            );
          }

          case 'h3': {
            const col = sectionColor(node.text);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                marginTop: i === 0 ? 0 : '10px', marginBottom: '3px',
              }}>
                <div style={{
                  width: '3px', height: '13px', borderRadius: '2px',
                  background: col, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: col,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                }}>{node.text}</span>
              </div>
            );
          }

          case 'bullet':
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '6px',
                paddingLeft: '8px', lineHeight: 1.55,
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}>
                <span style={{ color: accentColor, marginTop: '3px', fontSize: '8px', flexShrink: 0 }}>◆</span>
                <span style={{ fontSize: '11.5px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{renderInline(node.parts)}</span>
              </div>
            );

          case 'numbered':
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '6px',
                paddingLeft: '8px', lineHeight: 1.55,
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}>
                <span style={{
                  color: accentColor, fontSize: '10px', fontWeight: 700,
                  minWidth: '14px', flexShrink: 0, marginTop: '1px',
                }}>{node.n}.</span>
                <span style={{ fontSize: '11.5px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{renderInline(node.parts)}</span>
              </div>
            );

          case 'code':
            return <CodeBlock key={i} body={node.body} lang={node.lang} />;

          case 'hr':
            return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '6px 0' }} />;

          case 'blank':
            return <div key={i} style={{ height: '4px' }} />;

          case 'para':
            return (
              <div key={i} style={{ fontSize: '11.5px', lineHeight: 1.6, paddingLeft: '2px' }}>
                {renderInline(node.parts)}
              </div>
            );
        }
      })}
    </div>
  );
};
