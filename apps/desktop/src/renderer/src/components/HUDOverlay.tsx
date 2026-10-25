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
} from 'lucide-react';

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
  const [lastHotkeyAction, setLastHotkeyAction] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial state
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

  const handleMouseEnter = () => {
    if (window.electronAPI?.setDynamicIgnoreMouse) {
      window.electronAPI.setDynamicIgnoreMouse(false);
    }
  };

  const handleMouseLeave = () => {
    if (window.electronAPI?.setDynamicIgnoreMouse) {
      window.electronAPI.setDynamicIgnoreMouse(true);
    }
  };

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

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        background: 'rgba(9, 11, 17, 0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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
          padding: '12px 16px',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          cursor: 'grab',
        } as React.CSSProperties}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Sparkles size={16} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.3px', color: '#ffffff' }}>
                GhostPilot
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                Stealth HUD
              </span>
            </div>
          </div>
        </div>

        {/* Non-draggable controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          <StealthBadge isContentProtected={hudState.isContentProtected} />

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#d4d4d8',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            title={isCollapsed ? 'Expand HUD' : 'Collapse HUD'}
          >
            {isCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
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
            gap: '12px',
            padding: '14px 16px',
            overflowY: 'auto',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {/* Active Hotkey Notification Toast */}
          {lastHotkeyAction && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 600,
                animation: 'pulse 1.5s infinite',
              }}
            >
              <Radio size={14} />
              <span>Hotkey Triggered: {lastHotkeyAction.toUpperCase()} (Screen Vision Analysis)</span>
            </div>
          )}

          {/* Quick Stealth Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Click-Through Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleClickThrough}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: hudState.isClickThrough ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                  color: hudState.isClickThrough ? '#ffffff' : '#d4d4d8',
                  border: hudState.isClickThrough
                    ? '1px solid #059669'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.15s ease',
                }}
                title="When active, mouse clicks pass directly through to your editor or browser"
              >
                <MousePointer size={13} />
                <span>{hudState.isClickThrough ? 'Click-Through: ON' : 'Click-Through: OFF'}</span>
              </button>
            </div>

            {/* Opacity Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={13} color="#a1a1aa" />
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={hudState.opacity}
                onChange={handleOpacityChange}
                style={{
                  width: '90px',
                  cursor: 'pointer',
                  accentColor: '#10b981',
                }}
                title={`HUD Opacity: ${Math.round(hudState.opacity * 100)}%`}
              />
              <span style={{ fontSize: '11px', color: '#a1a1aa', minWidth: '32px', textAlign: 'right' }}>
                {Math.round(hudState.opacity * 100)}%
              </span>
            </div>
          </div>

          {/* Cheatsheet for Anti-Detection Hotkeys */}
          <HotkeyCheatsheet />

          {/* Child content (AuthStatus / Session State) */}
          {children}
        </div>
      )}
    </div>
  );
};
