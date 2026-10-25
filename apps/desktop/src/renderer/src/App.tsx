import React, { useState, useEffect } from 'react';
import { HUDOverlay } from './components/HUDOverlay';
import { AuthStatus } from './components/AuthStatus';
import { TranscriptFeed } from './components/TranscriptFeed';
import { AIAnswerCard } from './components/AIAnswerCard';
import { VisionSolutionCard } from './components/VisionSolutionCard';

import { promptEngine } from './services/promptEngine';

export const App: React.FC = () => {
  const [authData, setAuthData] = useState<{
    isAuthenticated: boolean;
    userEmail?: string;
    token?: string;
  }>({
    isAuthenticated: false,
  });

  useEffect(() => {
    // Attempt initial resume context sync from web vault
    promptEngine.syncActiveContext();

    if (window.electronAPI?.onAuthTokenReceived) {
      const cleanup = window.electronAPI.onAuthTokenReceived((payload) => {
        setAuthData({
          isAuthenticated: true,
          token: payload.token,
          userEmail: payload.email,
        });
        // Sync active resume context with received auth token
        promptEngine.syncActiveContext(undefined, payload.token);
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

        {/* Live Audio Pipeline & Local Whisper Offline Feed */}
        <TranscriptFeed />
      </HUDOverlay>
    </div>
  );
};

export default App;
