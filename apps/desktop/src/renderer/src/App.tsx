import React, { useState, useEffect } from 'react';
import { HUDOverlay } from './components/HUDOverlay';
import { LiveCopilotFeed } from './components/LiveCopilotFeed';
import { promptEngine } from './services/promptEngine';
import { GitBranch } from 'lucide-react';

export const App: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Attempt initial resume context sync from web vault
    promptEngine.syncActiveContext();

    if (window.electronAPI?.onAuthTokenReceived) {
      const cleanup = window.electronAPI.onAuthTokenReceived((payload) => {
        promptEngine.syncActiveContext(undefined, payload.token);
      });
      return cleanup;
    }
    return undefined;
  }, []);

  // Hotkey listener for notification toasts (e.g. followup bridge)
  useEffect(() => {
    if (window.electronAPI?.onHotkeyPressed) {
      const unsub = window.electronAPI.onHotkeyPressed((action) => {
        if (action === 'followup_bridge') {
          const lastCode = promptEngine.getLastSolvedCode();
          if (lastCode) {
            setToastMessage('Solved Code Context Active in Memory · Listening for Follow-up...');
          } else {
            setToastMessage('Ready · Capture problem with Ctrl+Shift+H to solve on-screen');
          }
          setTimeout(() => setToastMessage(null), 3500);
        }
      });
      return unsub;
    }
    return undefined;
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <HUDOverlay isListening={true}>
        {/* Floating Notification Toast */}
        {toastMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#34d399',
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <GitBranch size={12} color="#34d399" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Single Continuous Unified Chatbot Canvas */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '100%',
            height: '100%',
            boxSizing: 'border-box',
            overflowX: 'hidden',
          }}
        >
          <LiveCopilotFeed />
        </div>
      </HUDOverlay>
    </div>
  );
};

export default App;
