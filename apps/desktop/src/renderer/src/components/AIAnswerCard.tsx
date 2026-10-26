import React, { useState, useEffect } from 'react';
import { aiAnswerEngine } from '../services/aiAnswerEngine';
import { questionDetector } from '../services/questionDetector';
import { MarkdownView } from '../lib/markdownRenderer';
import { Sparkles, Copy, Check, X, RefreshCw, AlertCircle, Key } from 'lucide-react';

export const AIAnswerCard: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineKey, setInlineKey] = useState<string>('');

  useEffect(() => {
    // 1. Automatic Question Detection listener
    const unsubDetector = questionDetector.onQuestion((detectedQuestion, recentContext) => {
      setQuestion(detectedQuestion);
      setError(null);
      aiAnswerEngine.generateAnswer(detectedQuestion, recentContext);
    });

    // 2. Token-by-token streaming listener
    const unsubToken = aiAnswerEngine.onToken((_token, fullText) => {
      setAnswer(fullText);
      setIsGenerating(true);
    });

    const unsubComplete = aiAnswerEngine.onComplete((fullText) => {
      setAnswer(fullText);
      setIsGenerating(false);
    });

    const unsubError = aiAnswerEngine.onError((err) => {
      setError(err);
      setIsGenerating(false);
    });

    let unsubHotkey: (() => void) | undefined;
    if (window.electronAPI?.onHotkeyPressed) {
      unsubHotkey = window.electronAPI.onHotkeyPressed((action) => {
        if (action === 'manual_ask') {
          questionDetector.triggerManual();
        }
      });
    }

    return () => {
      unsubDetector();
      unsubToken();
      unsubComplete();
      unsubError();
      if (unsubHotkey) unsubHotkey();
    };
  }, []);

  const handleCopy = () => {
    if (answer) {
      navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualAsk = () => {
    questionDetector.triggerManual();
  };

  const handleDismiss = () => {
    aiAnswerEngine.cancel();
    setQuestion('');
    setAnswer('');
    setError(null);
    setIsGenerating(false);
  };

  if (!question && !answer && !isGenerating && !error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderRadius: '12px',
          background: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="#10b981" />
          <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Listening for interviewer questions...
          </span>
        </div>
        <button
          onClick={handleManualAsk}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            cursor: 'pointer',
          }}
        >
          Ask AI Now
        </button>
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
        background: '#0d1f18',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#10b981" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#34d399', letterSpacing: '0.04em' }}>
            Live Answer Recommendation
          </span>
          {isGenerating && (
            <span style={{ fontSize: '10px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={10} className="animate-spin" />
              Streaming...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopy}
            disabled={!answer}
            style={{
              padding: '4px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#d4d4d8',
              cursor: 'pointer',
            }}
            title="Copy Answer"
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
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {question && (
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#e4e4e7', fontStyle: 'italic', borderLeft: '2px solid #10b981', paddingLeft: '8px' }}>
          "{question}"
        </div>
      )}

      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#f87171' }}>
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
          {error.toLowerCase().includes('groq') && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="password"
                placeholder="Paste Groq key (starts with gsk_)"
                value={inlineKey}
                onChange={(e) => setInlineKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  if (inlineKey.trim()) {
                    const k = inlineKey.trim();
                    localStorage.setItem('ghostpilot_groq_api_key', k);
                    aiAnswerEngine.setApiKey(k);
                    setError(null);
                    if (question) {
                      aiAnswerEngine.generateAnswer(question);
                    }
                  }
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Key size={11} />
                <span>Save Key</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          maxHeight: '320px',
          overflowY: 'auto',
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(16,185,129,0.35) transparent',
        }}>
          {answer
            ? <MarkdownView md={answer} accentColor="#10b981" />
            : <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                Generating answer with candidate context…
              </span>
          }
        </div>
      )}
    </div>
  );
};
