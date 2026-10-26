import React, { useState, useEffect, useRef } from 'react';
import { audioCaptureService, AudioDevice } from '../services/audioCapture';
import { audioMultiplexer, AudioLevels } from '../services/audioMultiplexer';
import { localWhisperClient, TranscriptMessage, LocalSTTStatus } from '../services/localWhisperClient';
import {
  Mic,
  Play,
  Square,
  MessageSquare,
  Headphones,
  AlertCircle,
  Cpu,
} from 'lucide-react';

export const TranscriptFeed: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttStatus, setSttStatus] = useState<LocalSTTStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('Offline Ready');
  const [statusError, setStatusError] = useState<string | null>(null);

  const [audioLevels, setAudioLevels] = useState<AudioLevels>({
    interviewerLevel: 0,
    candidateLevel: 0,
  });

  const [microphones, setMicrophones] = useState<AudioDevice[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>(
    () => localStorage.getItem('ghostpilot_selected_mic') || ''
  );

  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enumerate microphones
    audioCaptureService.getMicrophones().then((devices) => {
      setMicrophones(devices);
      if (devices.length > 0 && !selectedMicId) {
        setSelectedMicId(devices[0].deviceId);
      }
    });

    // Subscribe to local Whisper transcript events
    const unsubTranscript = localWhisperClient.onTranscript((msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Subscribe to status changes
    const unsubStatus = localWhisperClient.onStatusChange((status, message) => {
      setSttStatus(status);
      if (message) setStatusMessage(message);
    });

    // Subscribe to live VU audio levels
    const unsubLevels = audioMultiplexer.onAudioLevels((levels) => {
      setAudioLevels(levels);
    });

    // Pipe PCM chunks to local Whisper VAD engine
    const unsubData = audioMultiplexer.onAudioData((chunk) => {
      localWhisperClient.sendAudio(chunk);
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
  }, [messages]);

  const handleMicChange = async (micId: string) => {
    setSelectedMicId(micId);
    localStorage.setItem('ghostpilot_selected_mic', micId);
    if (isListening) {
      try {
        const loopbackStream = await audioCaptureService.startLoopbackCapture();
        const micStream = await audioCaptureService.startMicrophoneCapture(micId);
        audioMultiplexer.stop();
        await audioMultiplexer.start(loopbackStream, micStream);
      } catch (err: any) {
        console.error('Failed to switch microphone:', err);
      }
    }
  };

  const startListening = async () => {
    try {
      setStatusError(null);
      // 1. Capture system loopback audio (Interviewer)
      const loopbackStream = await audioCaptureService.startLoopbackCapture();

      // 2. Capture microphone audio (Candidate) with selected device
      const micStream = await audioCaptureService.startMicrophoneCapture(selectedMicId || undefined);

      // Refresh microphones after permission is granted so device labels are visible
      audioCaptureService.getMicrophones().then((devices) => {
        if (devices.length > 0) setMicrophones(devices);
      });

      // 3. Initialize local Whisper transcriber
      await localWhisperClient.initialize();

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
    setAudioLevels({ interviewerLevel: 0, candidateLevel: 0 });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        flexShrink: 0,
      }}
    >
      {/* Session Controls & VU Meters Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px',
          borderRadius: '12px',
          background: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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

            {/* Local Whisper Engine Status Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#34d399',
              }}
            >
              <Cpu size={12} color="#10b981" />
              <span>Whisper STT (100% Offline)</span>
            </div>
          </div>

          {/* Engine Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color:
                sttStatus === 'ready' || sttStatus === 'transcribing'
                  ? '#34d399'
                  : sttStatus === 'loading'
                  ? '#fbbf24'
                  : sttStatus === 'error'
                  ? '#f87171'
                  : '#a1a1aa',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor:
                  sttStatus === 'ready' || sttStatus === 'transcribing'
                    ? '#10b981'
                    : sttStatus === 'loading'
                    ? '#f59e0b'
                    : sttStatus === 'error'
                    ? '#ef4444'
                    : '#71717a',
                display: 'inline-block',
              }}
            />
            <span style={{ textTransform: 'capitalize' }}>{statusMessage}</span>
          </div>
        </div>

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
            <div
              style={{
                height: '5px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round(audioLevels.interviewerLevel * 100))}%`,
                  background: 'linear-gradient(90deg, #a855f7 0%, #c084fc 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.05s ease',
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
              {microphones.length > 0 ? (
                <select
                  value={selectedMicId}
                  onChange={(e) => handleMicChange(e.target.value)}
                  style={{
                    fontSize: '9px',
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '4px',
                    padding: '1px 3px',
                    maxWidth: '115px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  title="Select Microphone Device"
                >
                  <option value="" style={{ background: '#111827', color: '#fff' }}>Default Mic</option>
                  {microphones.map((m) => (
                    <option key={m.deviceId} value={m.deviceId} style={{ background: '#111827', color: '#fff' }}>
                      {m.label.length > 18 ? m.label.slice(0, 18) + '…' : m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: '9px', color: '#a1a1aa' }}>Microphone</span>
              )}
            </div>
            <div
              style={{
                height: '5px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round(audioLevels.candidateLevel * 100))}%`,
                  background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.05s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Transcript Message Feed */}
      <div
        style={{
          height: '210px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px',
          borderRadius: '12px',
          background: '#0a0f1d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              color: '#52525b',
              fontSize: '11px',
              textAlign: 'center',
            }}
          >
            <MessageSquare size={22} color="#3f3f46" />
            <span>Dual-channel audio active. Live speech will transcribe here offline.</span>
            <span style={{ fontSize: '10px', color: '#10b981' }}>
              Zero API keys required • Auto-detects questions for AI answers
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            const isInterviewer = msg.speaker === 'interviewer';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  alignSelf: isInterviewer ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isInterviewer ? '#c084fc' : '#34d399',
                    paddingLeft: '4px',
                  }}
                >
                  {isInterviewer ? <Headphones size={10} /> : <Mic size={10} />}
                  <span>{isInterviewer ? 'Interviewer' : 'You (Candidate)'}</span>
                  <span style={{ color: '#52525b', fontSize: '9px', fontWeight: 400 }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: isInterviewer ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                    background: isInterviewer
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
                    border: isInterviewer
                      ? '1px solid rgba(168, 85, 247, 0.25)'
                      : '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#f4f4f5',
                    fontSize: '12px',
                    lineHeight: '1.4',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
