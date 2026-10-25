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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: '10px',
        background: '#0d1f1c',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: '#10b981',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Connected</span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            ({userEmail || 'Active Candidate'})
          </span>
        </div>
        {token && (
          <span style={{ fontSize: '10px', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
            Vault Synced
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: '10px',
      background: '#1c131d',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#f87171',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Radio size={16} />
        <span style={{ fontSize: '12px', fontWeight: 600 }}>Web Link Offline</span>
      </div>
      <span style={{ fontSize: '10px', color: '#fca5a5' }}>
        Click &quot;Launch Desktop App&quot; in web dashboard
      </span>
    </div>
  );
};
