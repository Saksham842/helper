import React, { useState, useEffect } from 'react';
import type { HUDState } from '@ghostpilot/shared';
import { HotkeyCheatsheet } from './HotkeyCheatsheet';
import {
  Sparkles,
  MousePointer,
  Minimize2,
  Maximize2,
  Radio,
  Key,
  Keyboard,
  Check,
} from 'lucide-react';
import { aiAnswerEngine } from '../services/aiAnswerEngine';

interface HUDOverlayProps {
  isListening?: boolean;
  children?: React.ReactNode;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  isListening = false,
  children,
}) => {
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
        setTimeout(() => setLastHotkeyAction(null), 2500);

        if (action === 'scroll_down') {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ top: 160, behavior: 'smooth' });
            scrollContainerRef.current.scrollTop += 160;
          }
          window.scrollBy({ top: 160, behavior: 'smooth' });
        } else if (action === 'scroll_up') {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ top: -160, behavior: 'smooth' });
            scrollContainerRef.current.scrollTop -= 160;
          }
          window.scrollBy({ top: -160, behavior: 'smooth' });
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

  const handleCycleOpacity = async () => {
    // Quick click cycle: 95% -> 80% -> 60% -> 40% -> 95%
    let nextOpacity = 0.95;
    if (hudState.opacity >= 0.9) nextOpacity = 0.8;
    else if (hudState.opacity >= 0.75) nextOpacity = 0.6;
    else if (hudState.opacity >= 0.55) nextOpacity = 0.4;
    else nextOpacity = 0.95;

    if (window.electronAPI?.setHUDOpacity) {
      const updated = await window.electronAPI.setHUDOpacity(nextOpacity);
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
    }, 1200);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '14px',
        background: '#0a0f1d',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        color: '#f4f4f5',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ── Single Ultra-Compact Top Header Bar (Height ~34px) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '35px',
          padding: '0 10px',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, #131b2e 0%, #0a0f1d 100%)',
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          cursor: 'grab',
          flexShrink: 0,
          gap: '6px',
        } as React.CSSProperties}
      >
        {/* Left Side: Brand emblem + Mode Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '5px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(16, 185, 129, 0.4)',
              cursor: 'grab',
              WebkitAppRegion: 'drag',
            } as React.CSSProperties}
            title="GhostPilot Stealth HUD · Drag Window"
          >
            <Sparkles size={11} color="#ffffff" />
          </div>

          {/* Single Unified Copilot Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '5px',
              fontSize: '10.5px',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.18)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
            }}
            title="GhostPilot Unified Live Copilot & Vision Solver"
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isListening ? '#10b981' : '#64748b',
                boxShadow: isListening ? '0 0 6px #10b981' : 'none',
              }}
            />
            <span>GhostPilot</span>
          </div>

          {/* Universal C++ Language Badge */}
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'rgba(99, 102, 241, 0.16)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.35)',
            }}
            title="Default Programming Language: C++ (C++20 STL)"
          >
            C++
          </span>
        </div>

        {/* Right Side: Status Pills & Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {/* Click-Through Status Badge */}
          <button
            onClick={handleToggleClickThrough}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              background: hudState.isClickThrough ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: hudState.isClickThrough ? '#34d399' : '#94a3b8',
              border: hudState.isClickThrough ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title="Click-Through Pass: Ctrl+Shift+M (Clicks pass through to IDE/Browser)"
          >
            <MousePointer size={10} />
            <span>{hudState.isClickThrough ? 'Click-Thru: ON' : 'Click-Thru: OFF'}</span>
          </button>

          {/* Opacity % Pill */}
          <button
            onClick={handleCycleOpacity}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title="Opacity: Ctrl+Shift+↑/↓ (Click to cycle)"
          >
            {Math.round(hudState.opacity * 100)}%
          </button>

          {/* Groq Key Configuration Toggle */}
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: showKeyInput ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: showKeyInput ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
            }}
            title="Configure Groq API Key"
          >
            <Key size={11} />
          </button>

          {/* Hotkey Cheatsheet Toggle */}
          <button
            onClick={() => setShowHotkeys(!showHotkeys)}
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: showHotkeys ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: showHotkeys ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer',
            }}
            title="Global Hotkeys Cheatsheet"
          >
            <Keyboard size={11} />
          </button>

          {/* Minimize / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            title={isCollapsed ? 'Expand HUD' : 'Collapse HUD'}
          >
            {isCollapsed ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          </button>
        </div>
      </div>

      {/* ── Main Body (100% Window Width, Zero Horizontal Scrollbars) ── */}
      {!isCollapsed && (
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '4px 8px 56px 8px',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {/* Active Hotkey Notification Toast */}
          {lastHotkeyAction && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '10px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <Radio size={11} />
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
                padding: '8px 10px',
                borderRadius: '8px',
                background: '#151e2e',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                flexShrink: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#93c5fd' }}>
                  Groq API Key (Vision &amp; Answers)
                </span>
                <span style={{ fontSize: '9px', color: '#64748b' }}>starts with gsk_</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                <input
                  type="password"
                  placeholder="Paste gsk_... key here"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '5px',
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
                    padding: '4px 10px',
                    borderRadius: '5px',
                    background: savedKeySuccess ? '#10b981' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {savedKeySuccess ? <Check size={11} /> : null}
                  <span>{savedKeySuccess ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Stealth Hotkey Cheatsheet */}
          {showHotkeys && (
            <div style={{ flexShrink: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
              <HotkeyCheatsheet onClose={() => setShowHotkeys(false)} />
            </div>
          )}

          {/* Active View Content */}
          <div
            style={{
              flex: 1,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
export default HUDOverlay;
