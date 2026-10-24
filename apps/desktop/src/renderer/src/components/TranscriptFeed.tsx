import React, { useState, useEffect, useRef } from 'react';
import { audioCaptureService } from '../services/audioCapture';
import { audioMultiplexer, AudioLevels } from '../services/audioMultiplexer';
import { deepgramLiveClient, TranscriptMessage, ConnectionStatus } from '../services/deepgramLiveClient';
import {
  Mic,
  Play,
  Square,
  Key,
  MessageSquare,
  Headphones,
  AlertCircle,
} from 'lucide-react';

export const TranscriptFeed: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [statusError, setStatusError] = useState<string | null>(null);

  const [audioLevels, setAudioLevels] = useState<AudioLevels>({
    interviewerLevel: 0,
    candidateLevel: 0,
  });

  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [interimInterviewer, setInterimInterviewer] = useState<string>('');
  const [interimCandidate, setInterimCandidate] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check localStorage for saved Deepgram key
    const savedKey = localStorage.getItem('parakeet_deepgram_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      deepgramLiveClient.setApiKey(savedKey);
    } else {
      setShowKeyInput(true);
    }

    // Subscribe to Deepgram transcript events
    const unsubTranscript = deepgramLiveClient.onTranscript((msg) => {
      if (msg.isFinal) {
        setMessages((prev) => [...prev, msg]);
        if (msg.speaker === 'interviewer') setInterimInterviewer('');
        if (msg.speaker === 'candidate') setInterimCandidate('');
      } else {
        if (msg.speaker === 'interviewer') setInterimInterviewer(msg.text);
        if (msg.speaker === 'candidate') setInterimCandidate(msg.text);
      }
    });

    // Subscribe to status changes
    const unsubStatus = deepgramLiveClient.onStatusChange((status, error) => {
      setConnectionStatus(status);
      setStatusError(error || null);
    });

    // Subscribe to live VU audio levels
    const unsubLevels = audioMultiplexer.onAudioLevels((levels) => {
      setAudioLevels(levels);
    });

    // Pipe PCM chunks to Deepgram
    const unsubData = audioMultiplexer.onAudioData((chunk) => {
      deepgramLiveClient.sendAudioChunk(chunk);
    });

    return () => {
      unsubTranscript();
      unsubStatus();
      unsubLevels();
      unsubData();
      stopListening();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimInterviewer, interimCandidate]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('parakeet_deepgram_api_key', apiKey.trim());
      deepgramLiveClient.setApiKey(apiKey.trim());
      setShowKeyInput(false);
      setStatusError(null);
    }
  };

  const startListening = async () => {
    if (!apiKey.trim()) {
      setShowKeyInput(true);
      return;
    }

    try {
      setStatusError(null);
      // 1. Capture system loopback audio (Interviewer)
      const loopbackStream = await audioCaptureService.startLoopbackCapture();

      // 2. Capture microphone audio (Candidate)
      const micStream = await audioCaptureService.startMicrophoneCapture();

      // 3. Connect to Deepgram Nova-2
      deepgramLiveClient.connect();

      // 4. Start 2-channel 16kHz PCM multiplexer
      await audioMultiplexer.start(loopbackStream, micStream);

      setIsListening(true);
    } catch (err: any) {
      console.error('Failed to start live listening session:', err);
      setStatusError(err.message || 'Failed to capture audio streams');
      stopListening();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    audioMultiplexer.stop();
    audioCaptureService.stopAll();
    deepgramLiveClient.disconnect();
    setAudioLevels({ interviewerLevel: 0, candidateLevel: 0 });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Session Controls & VU Meters Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={isListening ? stopListening : startListening}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: isListening
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: isListening
                  ? '0 2px 10px rgba(239, 68, 68, 0.3)'
                  : '0 2px 10px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {isListening ? <Square size={13} fill="#fff" /> : <Play size={13} fill="#fff" />}
              <span>{isListening ? 'Stop Listening' : 'Start Live Copilot'}</span>
            </button>

            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#a1a1aa',
                cursor: 'pointer',
              }}
              title="Configure Deepgram Nova-2 API Key"
            >
              <Key size={12} />
              <span>{apiKey ? 'Key Set' : 'Add Deepgram Key'}</span>
            </button>
          </div>

          {/* Connection Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color:
                connectionStatus === 'connected'
                  ? '#34d399'
                  : connectionStatus === 'connecting'
                  ? '#fbbf24'
                  : connectionStatus === 'error'
                  ? '#f87171'
                  : '#71717a',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor:
                  connectionStatus === 'connected'
                    ? '#10b981'
                    : connectionStatus === 'connecting'
                    ? '#f59e0b'
                    : connectionStatus === 'error'
                    ? '#ef4444'
                    : '#71717a',
                display: 'inline-block',
              }}
            />
            <span style={{ textTransform: 'capitalize' }}>Nova-2: {connectionStatus}</span>
          </div>
        </div>

        {/* Deepgram Key Input Drawer */}
        {showKeyInput && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <input
              type="password"
              placeholder="Deepgram Nova-2 API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#f4f4f5',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSaveApiKey}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
        )}

        {statusError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#f87171',
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <AlertCircle size={13} />
            <span>{statusError}</span>
          </div>
        )}

        {/* Dual-Channel Hardware VU Meters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
          {/* Interviewer VU */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '6px 8px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.06)',
              border: '1px solid rgba(168, 85, 247, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c084fc', fontSize: '10px', fontWeight: 600 }}>
                <Headphones size={11} />
                <span>Interviewer (Ch 0)</span>
              </div>
              <span style={{ fontSize: '9px', color: '#a1a1aa' }}>Loopback</span>
            </div>
            <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.round(audioLevels.interviewerLevel * 100)}%`,
                  background: 'linear-gradient(90deg, #a855f7, #c084fc)',
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          </div>

          {/* Candidate VU */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '6px 8px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '10px', fontWeight: 600 }}>
                <Mic size={11} />
                <span>Candidate (Ch 1)</span>
              </div>
              <span style={{ fontSize: '9px', color: '#a1a1aa' }}>Microphone</span>
            </div>
            <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.round(audioLevels.candidateLevel * 100)}%`,
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Feed Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          borderRadius: '14px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          minHeight: '220px',
          maxHeight: '340px',
        }}
      >
        {messages.length === 0 && !interimInterviewer && !interimCandidate ? (
          <div
            style={{
              margin: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#71717a',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            <MessageSquare size={24} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
              No speech detected yet
            </span>
            <span style={{ fontSize: '11px', maxWidth: '280px', lineHeight: 1.4 }}>
              Click <strong>Start Live Copilot</strong> and speak into your mic or play caller audio to see deterministic multi-channel diarization in real-time.
            </span>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isInterviewer = msg.speaker === 'interviewer';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: isInterviewer
                      ? 'rgba(168, 85, 247, 0.08)'
                      : 'rgba(16, 185, 129, 0.08)',
                    border: `1px solid ${
                      isInterviewer ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: isInterviewer ? '#c084fc' : '#34d399',
                      }}
                    >
                      {isInterviewer ? 'Interviewer' : 'You (Candidate)'}
                    </span>
                    <span style={{ fontSize: '9px', color: '#71717a' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#f4f4f5', lineHeight: 1.4 }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Interim Interviewer typing text */}
            {interimInterviewer && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: 'rgba(168, 85, 247, 0.04)',
                  border: '1px dashed rgba(168, 85, 247, 0.3)',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#c084fc' }}>
                  Interviewer (Speaking...)
                </span>
                <div style={{ fontSize: '12px', color: '#d4d4d8', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {interimInterviewer}
                </div>
              </div>
            )}

            {/* Interim Candidate typing text */}
            {interimCandidate && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.04)',
                  border: '1px dashed rgba(16, 185, 129, 0.3)',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399' }}>
                  You (Speaking...)
                </span>
                <div style={{ fontSize: '12px', color: '#d4d4d8', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {interimCandidate}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};
