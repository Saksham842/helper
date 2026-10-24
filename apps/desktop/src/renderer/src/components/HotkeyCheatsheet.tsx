import React from 'react';
import { Keyboard, MousePointer, Eye, Sliders, Sparkles } from 'lucide-react';

export const HotkeyCheatsheet: React.FC = () => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      combo: `${modKey}+Shift+V`,
      action: 'Toggle HUD Hide/Show',
      icon: <Eye size={13} color="#a1a1aa" />,
    },
    {
      combo: `${modKey}+Shift+M`,
      action: 'Toggle Click-Through',
      icon: <MousePointer size={13} color="#a1a1aa" />,
    },
    {
      combo: `${modKey}+Shift+↑/↓`,
      action: 'Adjust HUD Opacity',
      icon: <Sliders size={13} color="#a1a1aa" />,
    },
    {
      combo: `${modKey}+Shift+H`,
      action: 'Ask AI / Solve Problem',
      icon: <Sparkles size={13} color="#10b981" />,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        borderRadius: '14px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#a1a1aa',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <Keyboard size={13} />
        <span>Stealth Global Shortcuts</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {shortcuts.map((sc) => (
          <div
            key={sc.combo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {sc.icon}
              <span style={{ fontSize: '11px', color: '#d4d4d8' }}>{sc.action}</span>
            </div>
            <kbd
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '10px',
                fontWeight: 700,
                color: '#e4e4e7',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              {sc.combo}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};
