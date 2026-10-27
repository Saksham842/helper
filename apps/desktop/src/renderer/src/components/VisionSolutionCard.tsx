import React, { useState, useEffect } from 'react';
import { visionSolverService } from '../services/visionSolver';
import { groqKeyManager } from '../services/groqKeyManager';
import { MarkdownView } from '../lib/markdownRenderer';
import { Camera, Code, Copy, Check, X, RefreshCw, Cpu, Key, ArrowLeft, GitBranch } from 'lucide-react';

interface VisionSolutionCardProps {
  onBackToLive?: () => void;
  onSolutionUpdate?: (solution: string) => void;
  onBridgeFollowUp?: (solution: string) => void;
}

export const VisionSolutionCard: React.FC<VisionSolutionCardProps> = ({
  onBackToLive,
  onSolutionUpdate,
  onBridgeFollowUp,
}) => {
  const [solutionMarkdown, setSolutionMarkdown] = useState<string>('');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string>('C++');
  const [copied, setCopied] = useState<boolean>(false);
  const [inlineKey, setInlineKey] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI?.onHotkeyPressed) {
      const unsub = window.electronAPI.onHotkeyPressed((action) => {
        if (action === 'ask_ai') handleSolve();
        if (action === 'followup_bridge') {
          const current = solutionMarkdown || visionSolverService.getLastSolutionMarkdown();
          if (current) onBridgeFollowUp?.(current);
        }
      });
      return unsub;
    }
    return undefined;
  }, [targetLang, solutionMarkdown, onBridgeFollowUp]);

  useEffect(() => {
    const unsubToken = visionSolverService.onToken((_tok, full) => {
      setSolutionMarkdown(full);
      onSolutionUpdate?.(full);
      setIsSolving(true);
    });
    const unsubComplete = visionSolverService.onComplete((sol) => {
      setSolutionMarkdown(sol.fullMarkdown);
      onSolutionUpdate?.(sol.fullMarkdown);
      setIsSolving(false);
    });
    const unsubError = visionSolverService.onError((err) => {
      setError(err);
      setIsSolving(false);
    });
    return () => {
      unsubToken();
      unsubComplete();
      unsubError();
    };
  }, [onSolutionUpdate]);

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        height: '100%',
      }}
    >
      {/* ── Vision Top Controls Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderRadius: '8px',
          background: 'rgba(14, 23, 38, 0.85)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          flexShrink: 0,
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onBackToLive && (
            <button
              onClick={onBackToLive}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Return to Live Copilot Sandwich Feed (Ctrl+Shift+L)"
            >
              <ArrowLeft size={10} />
              <span>Copilot (Ctrl+Shift+L)</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={12} color="#60a5fa" />
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#60a5fa',
                letterSpacing: '0.04em',
              }}
            >
              Vision Problem Solver
            </span>
          </div>

          {isSolving && (
            <span style={{ fontSize: '10px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <RefreshCw size={9} className="animate-spin" /> Solving...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Target Programming Language Selector (Defaults to C++) */}
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            style={{
              background: '#090d16',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '4px',
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 6px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="C++">C++ (C++20 STL)</option>
            <option value="Python">Python</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Java">Java</option>
            <option value="Go">Go</option>
          </select>

          {/* Solve / Re-Solve Action Button */}
          <button
            onClick={handleSolve}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '10.5px',
              fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.25)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.45)',
              cursor: 'pointer',
            }}
            title="Press Ctrl+Shift+H anytime to capture on-screen problem"
          >
            <Code size={11} />
            <span>Solve (Ctrl+Shift+H)</span>
          </button>

          {solutionMarkdown && (
            <button
              onClick={() => onBridgeFollowUp?.(solutionMarkdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.22)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Bridge solved code into Live Copilot for interviewer follow-up questions (Ctrl+Shift+F)"
            >
              <GitBranch size={10} />
              <span>Follow-up (Ctrl+Shift+F)</span>
            </button>
          )}

          {solutionMarkdown && (
            <button
              onClick={handleCopy}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#d4d4d8',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Copy Code"
            >
              {copied ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {solutionMarkdown && (
            <button
              onClick={handleDismiss}
              style={{
                padding: '3px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
              }}
              title="Dismiss Solution"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Active Solution Body or Clean Blank Screen ── */}
      {error ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '11px', color: '#f87171', lineHeight: '1.4' }}>{error}</div>

          <div
            style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px 8px',
              borderRadius: '6px',
            }}
          >
            <div>
              <strong>Primary Key:</strong>{' '}
              {groqKeyManager.getPrimaryApiKey()
                ? `${groqKeyManager.getPrimaryApiKey().slice(0, 8)}...${groqKeyManager.getPrimaryApiKey().slice(-4)}`
                : 'Not Set'}
            </div>
            <div>
              <strong>Fallback Key:</strong>{' '}
              {groqKeyManager.getFallbackApiKey()
                ? `${groqKeyManager.getFallbackApiKey().slice(0, 8)}...${groqKeyManager.getFallbackApiKey().slice(-4)}`
                : 'Not Set'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              type="password"
              placeholder="Paste new Groq API key (starts with gsk_)"
              value={inlineKey}
              onChange={(e) => setInlineKey(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '5px',
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: '11px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  const k = inlineKey.trim();
                  if (k) {
                    groqKeyManager.setPrimaryApiKey(k);
                    setInlineKey('');
                    setError(null);
                    handleSolve();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '5px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Key size={10} />
                <span>Save as Primary &amp; Solve</span>
              </button>

              <button
                onClick={() => {
                  const k = inlineKey.trim();
                  if (k) {
                    groqKeyManager.setFallbackApiKey(k);
                    setInlineKey('');
                    setError(null);
                    handleSolve();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '5px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <Key size={10} />
                <span>Save as Fallback &amp; Solve</span>
              </button>
            </div>
          </div>
        </div>
      ) : solutionMarkdown ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '2px 2px 24px 2px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflowX: 'hidden',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          <MarkdownView md={solutionMarkdown} accentColor="#60a5fa" />
        </div>
      ) : isSolving ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 16px',
            borderRadius: '10px',
            background: 'rgba(14, 23, 38, 0.4)',
            border: '1px dashed rgba(59, 130, 246, 0.3)',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          <RefreshCw size={18} className="animate-spin" color="#60a5fa" />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#f1f5f9' }}>
            Capturing screen and solving problem in C++...
          </span>
          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
            Generating intuition script, modern C++20 code, and time/space complexity analysis.
          </span>
        </div>
      ) : (
        /* Empty / Idle State */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 16px',
            borderRadius: '10px',
            background: 'rgba(14, 23, 38, 0.35)',
            border: '1px dashed rgba(59, 130, 246, 0.2)',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          <Camera size={20} color="#60a5fa" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
            Ready to Solve On-Screen Problems
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '340px', lineHeight: 1.5 }}>
            Open LeetCode, HackerRank, Codeforces, or your IDE on screen and press{' '}
            <strong style={{ color: '#60a5fa' }}>Ctrl+Shift+H</strong>. GhostPilot captures the screen silently and provides what to say out loud, C++ code, and complexity breakdown.
          </span>
          <button
            onClick={handleSolve}
            style={{
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.25)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Camera size={12} />
            <span>Capture &amp; Solve Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default VisionSolutionCard;
