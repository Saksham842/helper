import React, { useState, useEffect } from 'react';
import { visionSolverService } from '../services/visionSolver';
import { aiAnswerEngine } from '../services/aiAnswerEngine';
import { MarkdownView } from '../lib/markdownRenderer';
import { Camera, Code, Copy, Check, X, RefreshCw, Cpu, Key } from 'lucide-react';

export const VisionSolutionCard: React.FC = () => {
  const [solutionMarkdown, setSolutionMarkdown] = useState<string>('');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string>('Python');
  const [copied, setCopied] = useState<boolean>(false);
  const [inlineKey, setInlineKey] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI?.onHotkeyPressed) {
      const unsub = window.electronAPI.onHotkeyPressed((action) => {
        if (action === 'ask_ai') handleSolve();
      });
      return unsub;
    }
    return undefined;
  }, [targetLang]);

  useEffect(() => {
    const unsubToken    = visionSolverService.onToken((_tok, full) => { setSolutionMarkdown(full); setIsSolving(true); });
    const unsubComplete = visionSolverService.onComplete((sol) => { setSolutionMarkdown(sol.fullMarkdown); setIsSolving(false); });
    const unsubError    = visionSolverService.onError((err) => { setError(err); setIsSolving(false); });
    return () => { unsubToken(); unsubComplete(); unsubError(); };
  }, []);

  const handleSolve = () => {
    setError(null);
    setSolutionMarkdown('');
    setIsSolving(true);
    visionSolverService.captureAndSolve(targetLang);
  };

  const handleCopy = () => {
    if (solutionMarkdown) {
      const codeMatch = solutionMarkdown.match(/```(?:\w+)?\n([\s\S]*?)```/);
      navigator.clipboard.writeText(codeMatch ? codeMatch[1].trim() : solutionMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDismiss = () => {
    visionSolverService.cancel();
    setSolutionMarkdown('');
    setError(null);
    setIsSolving(false);
  };

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (!solutionMarkdown && !isSolving && !error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: '12px',
        background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={14} color="#60a5fa" />
          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Coding Vision Solver</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            style={{
              background: '#090d16', color: '#cbd5e1',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px', fontSize: '11px',
              padding: '3px 6px', outline: 'none', cursor: 'pointer',
            }}
          >
            <option>Python</option>
            <option>TypeScript</option>
            <option>Java</option>
            <option>C++</option>
            <option>Go</option>
          </select>
          <button
            onClick={handleSolve}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '6px',
              fontSize: '11px', fontWeight: 600,
              background: 'rgba(59,130,246,0.2)', color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.4)', cursor: 'pointer',
            }}
            title="Press Ctrl+Shift+H anytime to solve on-screen problem"
          >
            <Code size={12} />
            <span>Solve (Ctrl+Shift+H)</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Active / result state ───────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      padding: '12px', borderRadius: '14px',
      background: '#0e1726',
      border: '1px solid rgba(59,130,246,0.35)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} color="#60a5fa" />
          <span style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
            color: '#60a5fa', letterSpacing: '0.04em',
          }}>
            Vision Solution · {targetLang}
          </span>
          {isSolving && (
            <span style={{ fontSize: '10px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={10} className="animate-spin" /> Solving…
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopy} disabled={!solutionMarkdown}
            style={{ padding: '4px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#d4d4d8', cursor: 'pointer' }}
            title="Copy Code"
          >
            {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
          </button>
          <button
            onClick={handleDismiss}
            style={{ padding: '4px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            fontSize: '11px', color: '#f87171',
            padding: '6px 8px', borderRadius: '6px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          }}>{error}</div>
          {error.toLowerCase().includes('groq') && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="password"
                placeholder="Paste Groq key (starts with gsk_)"
                value={inlineKey}
                onChange={(e) => setInlineKey(e.target.value)}
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: '6px',
                  background: '#090d16', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: '11px', outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  const k = inlineKey.trim();
                  if (k) {
                    localStorage.setItem('ghostpilot_groq_api_key', k);
                    aiAnswerEngine.setApiKey(k);
                    setError(null);
                    handleSolve();
                  }
                }}
                style={{
                  padding: '5px 12px', borderRadius: '6px',
                  background: '#10b981', color: '#fff',
                  border: 'none', fontSize: '11px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                }}
              >
                <Key size={11} /><span>Save & Solve</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          maxHeight: '360px', overflowY: 'auto',
          padding: '10px 12px', borderRadius: '10px',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.07)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99,102,241,0.4) transparent',
        }}>
          {solutionMarkdown
            ? <MarkdownView md={solutionMarkdown} accentColor="#6366f1" />
            : <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                Capturing screen and analysing via Groq Vision…
              </span>
          }
        </div>
      )}
    </div>
  );
};
