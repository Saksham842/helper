import React, { useState, useEffect } from 'react';
import { AuthStatus } from './components/AuthStatus';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [authData, setAuthData] = useState<{
    isAuthenticated: boolean;
    userEmail?: string;
    token?: string;
  }>({
    isAuthenticated: false,
  });

  useEffect(() => {
    if (window.electronAPI?.onAuthTokenReceived) {
      const cleanup = window.electronAPI.onAuthTokenReceived((payload) => {
        setAuthData({
          isAuthenticated: true,
          token: payload.token,
          userEmail: payload.email,
        });
      });
      return cleanup;
    }
    return undefined;
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      boxSizing: 'border-box',
      padding: '20px',
      background: 'rgba(10, 12, 16, 0.85)',
      backdropFilter: 'blur(20px)',
      color: '#f4f4f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>
            Parakeet AI Copilot
          </span>
        </div>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '100px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#a1a1aa',
        }}>
          HUD v1.0
        </div>
      </div>

      <AuthStatus
        isAuthenticated={authData.isAuthenticated}
        userEmail={authData.userEmail}
        token={authData.token}
      />

      <div style={{
        flex: 1,
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        gap: '8px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e4e4e7' }}>
          Real-Time Live HUD Ready
        </div>
        <div style={{ fontSize: '12px', color: '#71717a', maxWidth: '320px', lineHeight: 1.5 }}>
          Screen-share invisible overlay window initialized. Start an interview or call from the dashboard to begin real-time speech diarization and AI suggestions.
        </div>
      </div>
    </div>
  );
};

export default App;
