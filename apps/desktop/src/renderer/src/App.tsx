import React, { useState, useEffect } from 'react';
import { HUDOverlay } from './components/HUDOverlay';
import { AuthStatus } from './components/AuthStatus';
import { TranscriptFeed } from './components/TranscriptFeed';
import { AIAnswerCard } from './components/AIAnswerCard';
import { VisionSolutionCard } from './components/VisionSolutionCard';
import { Terminal, Shield, Cpu, Activity } from 'lucide-react';

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
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <HUDOverlay>
        <AuthStatus
          isAuthenticated={authData.isAuthenticated}
          userEmail={authData.userEmail}
          token={authData.token}
        />

        {/* Real-Time Coding Problem Vision Solver */}
        <VisionSolutionCard />

        {/* Sub-Second Streaming AI Answer Card */}
        <AIAnswerCard />

        {/* Live Audio Pipeline & Deepgram Diarization Feed */}
        <TranscriptFeed />

        {/* Live Copilot Status Card */}
        <div
          style={{
            borderRadius: '14px',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} color="#10b981" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                Copilot Engine Status
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              Standby / Undetected
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
            }}
          >
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#a1a1aa' }}>
                <Shield size={11} color="#10b981" />
                <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Focus Shield</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>Zero Blur Loss</span>
              <span style={{ fontSize: '9px', color: '#71717a' }}>focusable: false</span>
            </div>

            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#a1a1aa' }}>
                <Cpu size={11} color="#10b981" />
                <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>OS Invisibility</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>Excluded from Capture</span>
              <span style={{ fontSize: '9px', color: '#71717a' }}>WDA_EXCLUDE</span>
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Terminal size={13} color="#71717a" />
            <span style={{ fontSize: '10px', color: '#a1a1aa', lineHeight: 1.4 }}>
              Press <strong style={{ color: '#ffffff' }}>Ctrl+Shift+H</strong> anytime to trigger silent vision problem solver.
            </span>
          </div>
        </div>
      </HUDOverlay>
    </div>
  );
};

export default App;
