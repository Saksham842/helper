import React from 'react';
import { ShieldCheck, Radio } from 'lucide-react';

interface AuthStatusProps {
  isAuthenticated: boolean;
  userEmail?: string;
  token?: string;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({
  isAuthenticated,
  userEmail,
  token,
}) => {
  if (isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        borderRadius: '16px',
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        color: '#10b981',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <ShieldCheck size={18} />
          <span>Desktop Copilot Connected</span>
        </div>
        <div style={{ fontSize: '13px', color: '#d1fae5' }}>
          Signed in as <strong>{userEmail || 'Active Candidate'}</strong>
        </div>
        {token && (
          <div style={{ fontSize: '11px', color: '#6ee7b7', wordBreak: 'break-all' }}>
            Session Active (Token: {token.slice(0, 12)}...)
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '16px',
      borderRadius: '16px',
      background: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      color: '#f87171',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
        <Radio size={18} />
        <span>Waiting for Web Connection</span>
      </div>
      <div style={{ fontSize: '13px', color: '#fecaca' }}>
        Log in to the Parakeet AI web dashboard and click <strong>&quot;Launch Desktop App&quot;</strong> to link this overlay.
      </div>
    </div>
  );
};
