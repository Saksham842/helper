import React from 'react';
import {
  Keyboard,
  MousePointer,
  Eye,
  Sliders,
  Sparkles,
  ShieldAlert,
  CornerDownLeft,
  ArrowUpDown,
  Trash2,
  GitBranch,
  X,
} from 'lucide-react';

interface HotkeyCheatsheetProps {
  onClose?: () => void;
}

export const HotkeyCheatsheet: React.FC<HotkeyCheatsheetProps> = ({ onClose }) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const groups = [
    {
      category: 'Live Interview Copilot',
      color: '#34d399',
      items: [
        {
          keys: [modKey, 'Shift', 'L'],
          action: 'Toggle / Start Copilot',
          desc: 'Starts dual audio capture and live STT',
          icon: <Sparkles size={11} color="#34d399" />,
        },
        {
          keys: [modKey, 'Shift', 'X'],
          action: 'Clear Chat & Memory',
          desc: 'Wipes exchanges and resets prompt memory',
          icon: <Trash2 size={11} color="#f87171" />,
        },
        {
          keys: [modKey, 'Shift', 'F'],
          action: 'Follow-Up Code Bridge',
          desc: 'Bridges solved code into live copilot context',
          icon: <GitBranch size={11} color="#38bdf8" />,
        },
        {
          keys: [modKey, 'Enter'],
          action: 'Ask AI Now (Manual)',
          desc: 'Forces immediate question formulation',
          icon: <CornerDownLeft size={11} color="#a7f3d0" />,
        },
      ],
    },
    {
      category: 'Vision DSA Solver',
      color: '#60a5fa',
      items: [
        {
          keys: [modKey, 'Shift', 'H'],
          action: 'Solve On-Screen Problem',
          desc: 'Silent capture problem and stream directly into chat',
          icon: <Sparkles size={11} color="#60a5fa" />,
        },
        {
          keys: ['Ctrl', '↑/↓'],
          aliases: ['PgUp/PgDn'],
          action: 'Vertical Content Scroll',
          desc: 'Scrolls active answer without mouse focus',
          icon: <ArrowUpDown size={11} color="#fbbf24" />,
        },
      ],
    },
    {
      category: 'Core HUD Stealth',
      color: '#a78bfa',
      items: [
        {
          keys: [modKey, '\\'],
          aliases: [`${modKey}+Shift+V`],
          action: 'Toggle HUD Visibility',
          desc: 'Shows or hides HUD without focus loss',
          icon: <Eye size={11} color="#34d399" />,
        },
        {
          keys: [modKey, 'Shift', 'M'],
          action: 'Toggle Click-Through',
          desc: 'Passes mouse events straight through to IDE',
          icon: <MousePointer size={11} color="#a78bfa" />,
        },
        {
          keys: [modKey, 'Shift', '↑/↓'],
          action: 'Adjust Opacity ±10%',
          desc: 'Cycles HUD transparency level',
          icon: <Sliders size={11} color="#fbbf24" />,
        },
        {
          keys: [modKey, 'Shift', 'Q'],
          action: 'Panic Crash-Hide',
          desc: 'Emergency instantaneous window concealment',
          icon: <ShieldAlert size={11} color="#f87171" />,
        },
      ],
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header with Title and Close Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Keyboard size={12} color="#60a5fa" />
          </div>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#f1f5f9',
              letterSpacing: '0.04em',
            }}
          >
            Global Shortcuts Cheatsheet
          </span>
          <span
            style={{
              fontSize: '9px',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            Stealth Active
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            title="Close Cheatsheet"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Grouped Hotkey Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {groups.map((grp) => (
          <div key={grp.category} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: grp.color,
                }}
              >
                {grp.category}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '5px',
              }}
            >
              {grp.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    {item.icon}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#e2e8f0',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.action}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                    {item.keys.map((k, ki) => (
                      <React.Fragment key={ki}>
                        <kbd
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: '#f8fafc',
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.16)',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                          }}
                        >
                          {k}
                        </kbd>
                        {ki < item.keys.length - 1 && (
                          <span style={{ fontSize: '9px', color: '#64748b', margin: '0 1px' }}>+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default HotkeyCheatsheet;
