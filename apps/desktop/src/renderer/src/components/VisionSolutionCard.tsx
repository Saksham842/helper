import React, { useState, useEffect } from 'react';
import { visionSolverService } from '../services/visionSolver';
import { Camera, Code, Copy, Check, X, RefreshCw, Cpu } from 'lucide-react';

export const VisionSolutionCard: React.FC = () => {
  const [solutionMarkdown, setSolutionMarkdown] = useState<string>('');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string>('Python');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Listen for global shortcut CommandOrControl+Shift+H
    if (window.electronAPI?.onHotkeyPressed) {
      const unsub = window.electronAPI.onHotkeyPressed((action) => {
        if (action === 'ask_ai') {
          handleSolve();
        }
      });
      return unsub;
    }
    return undefined;
  }, [targetLang]);

  useEffect(() => {
    const unsubToken = visionSolverService.onToken((_tok, full) => {
      setSolutionMarkdown(full);
      setIsSolving(true);
    });

    const unsubComplete = visionSolverService.onComplete((sol) => {
      setSolutionMarkdown(sol.fullMarkdown);
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
  }, []);

  const handleSolve = () => {
    setError(null);
    setSolutionMarkdown('');
    setIsSolving(true);
    visionSolverService.captureAndSolve(targetLang);
  };

  const handleCopy = () => {
    if (solutionMarkdown) {
      // Extract code if possible
      const codeMatch = solutionMarkdown.match(/```(?:\w+)?\n([\s\S]*?)```/);
      const textToCopy = codeMatch ? codeMatch[1].trim() : solutionMarkdown;
      navigator.clipboard.writeText(textToCopy);
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

  if (!solutionMarkdown && !isSolving && !error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={14} color="#60a5fa" />
          <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
            Coding Assessment Vision Solver
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              color: '#d4d4d8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              fontSize: '11px',
              padding: '2px 4px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="Python">Python</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Java">Java</option>
            <option value="C++">C++</option>
            <option value="Go">Go</option>
          </select>

          <button
            onClick={handleSolve}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        borderRadius: '14px',
        background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.2) 0%, rgba(15, 23, 42, 0.4) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} color="#60a5fa" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#60a5fa', letterSpacing: '0.04em' }}>
            Silent Vision Solution ({targetLang})
          </span>
          {isSolving && (
            <span style={{ fontSize: '10px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={10} className="animate-spin" />
              Analyzing Screen...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopy}
            disabled={!solutionMarkdown}
            style={{
              padding: '4px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#d4d4d8',
              cursor: 'pointer',
            }}
            title="Copy Code Solution"
          >
            {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: '4px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
            }}
            title="Dismiss Solution"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ fontSize: '11px', color: '#f87171', padding: '6px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)' }}>
          {error}
        </div>
      ) : (
        <div
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: 1.45,
            color: '#f4f4f5',
            whiteSpace: 'pre-wrap',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            background: 'rgba(0, 0, 0, 0.45)',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {solutionMarkdown || 'Analyzing screenshot via Claude 3.5 Vision...'}
        </div>
      )}
    </div>
  );
};
