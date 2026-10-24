import React from 'react';
import { EyeOff, ShieldCheck } from 'lucide-react';

interface StealthBadgeProps {
  isContentProtected: boolean;
}

export const StealthBadge: React.FC<StealthBadgeProps> = ({ isContentProtected }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        background: isContentProtected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)'
          : 'rgba(239, 68, 68, 0.15)',
        border: `1px solid ${isContentProtected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        boxShadow: isContentProtected ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none',
      }}
      title={
        isContentProtected
          ? 'Native WDA_EXCLUDEFROMCAPTURE active: 100% invisible to Zoom, Teams, Google Meet, and screen recordings.'
          : 'Screen protection inactive'
      }
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isContentProtected ? '#10b981' : '#ef4444',
          boxShadow: isContentProtected ? '0 0 8px #10b981' : 'none',
          display: 'inline-block',
        }}
      />
      {isContentProtected ? (
        <ShieldCheck size={12} color="#10b981" />
      ) : (
        <EyeOff size={12} color="#ef4444" />
      )}
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: isContentProtected ? '#34d399' : '#f87171',
        }}
      >
        {isContentProtected ? 'Invisible to Screen Share' : 'Visible'}
      </span>
    </div>
  );
};
