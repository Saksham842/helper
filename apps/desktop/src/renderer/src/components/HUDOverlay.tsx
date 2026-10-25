import React, { useState, useEffect } from 'react';
import type { HUDState } from '@ghostpilot/shared';
import { StealthBadge } from './StealthBadge';
import { HotkeyCheatsheet } from './HotkeyCheatsheet';
import {
  Sparkles,
  MousePointer,
  Minimize2,
  Maximize2,
  Sliders,
  Radio,
  Key,
  Keyboard,
  Check,
} from 'lucide-react';
import { aiAnswerEngine } from '../services/aiAnswerEngine';

interface HUDOverlayProps {
  children?: React.ReactNode;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({ children }) => {
  const [hudState, setHudState] = useState<HUDState>({
    isVisible: true,
    opacity: 0.95,
    isClickThrough: false,
    isContentProtected: true,
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [showHotkeys, setShowHotkeys] = useState<boolean>(false);
  const [groqKey, setGroqKey] = useState<string>('');
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);
  const [lastHotkeyAction, setLastHotkeyAction] = useState<string | null>(null);

  useEffect(() => {
    // Load existing Groq key if present
    const existing = localStorage.getItem('ghostpilot_groq_api_key') || '';
    setGroqKey(existing);
    if (existing) {
      aiAnswerEngine.setApiKey(existing);
    }

    // Fetch initial HUD state
    if (window.electronAPI?.getHUDState) {
      window.electronAPI.getHUDState().then((state) => {
        if (state) setHudState(state);
      });
    }

    // Subscribe to state updates
    if (window.electronAPI?.onHUDStateChange) {
      const cleanup = window.electronAPI.onHUDStateChange((state) => {
        setHudState(state);
      });
      return cleanup;
    }
    return undefined;
  }, []);

  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.electronAPI?.onHotkeyPressed) {
      const cleanup = window.electronAPI.onHotkeyPressed((action) => {
        setLastHotkeyAction(action);
        setTimeout(() => setLastHotkeyAction(null), 3000);
        if (action === 'scroll_down' && scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: 120, behavior: 'smooth' });
        } else if (action === 'scroll_up' && scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ top: -120, behavior: 'smooth' });
        }
      });
      return cleanup;
    }
    return undefined;
  }, []);

  const handleToggleClickThrough = async () => {
    if (window.electronAPI?.toggleHUDClickThrough) {
      const updated = await window.electronAPI.toggleHUDClickThrough();
      setHudState(updated);
    }
  };

  const handleOpacityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (window.electronAPI?.setHUDOpacity) {
      const updated = await window.electronAPI.setHUDOpacity(val);
      setHudState(updated);
    }
  };

  const handleSaveGroqKey = () => {
    const trimmed = groqKey.trim();
    localStorage.setItem('ghostpilot_groq_api_key', trimmed);
    aiAnswerEngine.setApiKey(trimmed);
    setSavedKeySuccess(true);
    setTimeout(() => {
      setSavedKeySuccess(false);
      setShowKeyInput(false);
    }, 1500);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        color: '#f4f4f5',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Draggable Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, #111827 0%, #0a0f1d 100%)',
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          cursor: 'grab',
          flexShrink: 0,
        } as React.CSSProperties}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Sparkles size={14} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '-0.2px', color: '#ffffff' }}>
              GhostPilot
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              Stealth HUD
            </span>
          </div>
        </div>

        {/* Non-draggable controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          <StealthBadge isContentProtected={hudState.isContentProtected} />

          {/* Groq Key Input Toggle */}
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: showKeyInput ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: showKeyInput ? '#34d399' : '#d4d4d8',
              cursor: 'pointer',
            }}
            title="Configure Groq AI API Key"
          >
            <Key size={12} />
          </button>

          {/* Hotkeys Toggle */}
          <button
            onClick={() => setShowHotkeys(!showHotkeys)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: showHotkeys ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: showHotkeys ? '#60a5fa' : '#d4d4d8',
              cursor: 'pointer',
            }}
            title="Stealth Hotkey Cheatsheet"
          >
            <Keyboard size={12} />
          </button>

          {/* Minimize / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#d4d4d8',
              cursor: 'pointer',
            }}
            title={isCollapsed ? 'Expand HUD' : 'Collapse HUD'}
          >
            {isCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {!isCollapsed && (
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '12px 14px',
            overflowY: 'auto',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {/* Quick Stealth Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '10px',
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0,
            }}
          >
            {/* Click-Through Toggle */}
            <button
              onClick={handleToggleClickThrough}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: hudState.isClickThrough ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                color: hudState.isClickThrough ? '#ffffff' : '#d4d4d8',
                border: hudState.isClickThrough
                  ? '1px solid #059669'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              }}
              title="When Click-Through is ON, clicks pass directly to your browser/IDE (Ctrl+Shift+M)"
            >
              <MousePointer size={12} />
              <span>{hudState.isClickThrough ? 'Click-Through: ON' : 'Click-Through: OFF'}</span>
            </button>

            {/* Opacity Control Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={12} color="#a1a1aa" />
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={hudState.opacity}
                onChange={handleOpacityChange}
                style={{
                  width: '80px',
                  cursor: 'pointer',
                  accentColor: '#10b981',
                }}
                title={`Overlay Opacity: ${Math.round(hudState.opacity * 100)}%`}
              />
              <span style={{ fontSize: '10px', color: '#94a3b8', minWidth: '28px', textAlign: 'right' }}>
                {Math.round(hudState.opacity * 100)}%
              </span>
            </div>
          </div>

          {/* Active Hotkey Notification Toast */}
          {lastHotkeyAction && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <Radio size={13} />
              <span>Hotkey: {lastHotkeyAction.toUpperCase()}</span>
            </div>
          )}

          {/* Groq API Key Configuration Drawer */}
          {showKeyInput && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: '#151e2e',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#93c5fd' }}>
                  Groq API Key (Free Vision &amp; Fast Answers)
                </span>
                <span style={{ fontSize: '9px', color: '#64748b' }}>starts with gsk_</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="password"
                  placeholder="Paste gsk_... key here"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    borderRadius: '6px',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSaveGroqKey}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: savedKeySuccess ? '#10b981' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {savedKeySuccess ? <Check size={12} /> : null}
                  <span>{savedKeySuccess ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Stealth Hotkey Cheatsheet */}
          {showHotkeys && (
            <div style={{ flexShrink: 0 }}>
              <HotkeyCheatsheet />
            </div>
          )}

          {/* App Children: AuthStatus, VisionSolutionCard, AIAnswerCard, TranscriptFeed */}
          {children}
        </div>
      )}
    </div>
  );
};
