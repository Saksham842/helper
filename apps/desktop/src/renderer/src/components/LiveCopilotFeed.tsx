import React, { useState, useEffect, useRef } from 'react';
import { audioCaptureService } from '../services/audioCapture';
import { audioMultiplexer, AudioLevels } from '../services/audioMultiplexer';
import { localWhisperClient, TranscriptMessage, LocalSTTStatus } from '../services/localWhisperClient';
import { questionDetector } from '../services/questionDetector';
import { aiAnswerEngine } from '../services/aiAnswerEngine';
import { promptEngine, type ConversationTurn } from '../services/promptEngine';
import { visionSolverService } from '../services/visionSolver';
import { MarkdownView } from '../lib/markdownRenderer';
import {
  Mic,
  MicOff,
  Camera,
  Trash2,
  MousePointer,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

export interface SandwichTurn {
  id: string;
  interviewerQuestion: string;
  interviewerTime: string;
  questionSource?: 'interviewer' | 'candidate';
  copilotAnswer: string;
  copilotTime: string;
  isStreamingCopilot: boolean;
  isVision?: boolean;
  candidateSpoken: string;
  candidateTime?: string;
  coachEvaluation?: string;
  isStreamingCoach?: boolean;
  error?: string | null;
}

interface LiveCopilotFeedProps {
  onSolveScreen?: () => void;
  onClearContext?: () => void;
  isClickThrough?: boolean;
  onToggleClickThrough?: () => void;
}

export const LiveCopilotFeed: React.FC<LiveCopilotFeedProps> = ({
  onSolveScreen,
  onClearContext,
  isClickThrough = false,
  onToggleClickThrough,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isMicPaused, setIsMicPaused] = useState<boolean>(false);
  const [sttStatus, setSttStatus] = useState<LocalSTTStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('Offline Ready');
  const [statusError, setStatusError] = useState<string | null>(null);

  const [audioLevels, setAudioLevels] = useState<AudioLevels>({
    interviewerLevel: 0,
    candidateLevel: 0,
  });

  const [selectedMicId, setSelectedMicId] = useState<string>(
    () => localStorage.getItem('ghostpilot_selected_mic') || ''
  );

  // Cohesive Sandwich Turns buffer (Terminal Infinite Canvas)
  const [turns, setTurns] = useState<SandwichTurn[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rolling multi-turn memory
  const turnsRef = useRef<ConversationTurn[]>([]);
  const turnsStateRef = useRef<SandwichTurn[]>([]);
  turnsStateRef.current = turns;

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef<boolean>(true);

  // Reliable Auto-scroll helper
  const scrollToBottom = (instant = false) => {
    if (isAutoScrollEnabled.current && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [turns]);

  // Audio capture & Local Whisper pipeline lifecycle
  useEffect(() => {
    audioCaptureService.getMicrophones().then((devices) => {
      if (devices.length > 0 && !selectedMicId) {
        setSelectedMicId(devices[0].deviceId);
      }
    });

    // 1. Subscribe to Local Whisper speech transcripts
    const unsubTranscript = localWhisperClient.onTranscript((msg: TranscriptMessage) => {
      if (!msg.isFinal) return;

      const trimmedText = msg.text.trim();
      if (!trimmedText) return;

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (msg.speaker === 'candidate') {
        // Candidate speech: Append to candidateSpoken of the latest sandwich turn, or create an initial turn
        setTurns((prev) => {
          if (prev.length > 0) {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            const updatedSpoken = last.candidateSpoken ? `${last.candidateSpoken} ${trimmedText}` : trimmedText;
            copy[copy.length - 1] = {
              ...last,
              candidateSpoken: updatedSpoken,
              candidateTime: nowStr,
            };
            return copy;
          }

          // Initial candidate speech before any question
          const initialTurn: SandwichTurn = {
            id: `turn-${Date.now()}`,
            interviewerQuestion: '',
            interviewerTime: nowStr,
            copilotAnswer: '',
            copilotTime: nowStr,
            isStreamingCopilot: false,
            candidateSpoken: trimmedText,
            candidateTime: nowStr,
            coachEvaluation: '',
            isStreamingCoach: false,
          };
          return [initialTurn];
        });

        // Add to rolling conversational turns
        turnsRef.current.push({
          id: msg.id,
          role: 'candidate_spoken',
          text: trimmedText,
          timestamp: msg.timestamp,
        });

        scrollToBottom();
      }

      // Feed transcript into questionDetector for both interviewer questions and candidate topic clarifications
      questionDetector.processTranscript(msg);
    });

    // 2. Subscribe to automatic question detector
    const unsubQuestion = questionDetector.onQuestion((detectedQuestion, _recentContext, source) => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const qId = `q-${Date.now()}`;
      const turnId = `turn-${Date.now()}`;

      // Save question turn to rolling history
      turnsRef.current.push({
        id: qId,
        role: source === 'candidate' ? 'candidate_spoken' : 'interviewer',
        text: detectedQuestion,
        timestamp: Date.now(),
      });

      // Append new Sandwich Turn
      setTurns((prev) => {
        // If the last turn only had candidateSpoken and no question, attach this question to it
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          if (!last.interviewerQuestion && !last.copilotAnswer) {
            const copy = [...prev];
            copy[copy.length - 1] = {
              ...last,
              interviewerQuestion: detectedQuestion,
              interviewerTime: nowStr,
              questionSource: source,
              copilotAnswer: '',
              copilotTime: nowStr,
              isStreamingCopilot: true,
              error: null,
            };
            return copy;
          }
        }

        const newTurn: SandwichTurn = {
          id: turnId,
          interviewerQuestion: detectedQuestion,
          interviewerTime: nowStr,
          questionSource: source,
          copilotAnswer: '',
          copilotTime: nowStr,
          isStreamingCopilot: true,
          isVision: false,
          candidateSpoken: '',
          coachEvaluation: '',
          isStreamingCoach: false,
          error: null,
        };
        return [...prev, newTurn];
      });

      // Trigger Groq AI Answer with multi-turn rolling context
      aiAnswerEngine.generateAnswer(detectedQuestion, turnsRef.current);
      scrollToBottom();
    });

    // 3. Subscribe to candidate answer evaluation
    const unsubCandidateAnswer = questionDetector.onCandidateAnswer((candidateSpoken, precedingQuestion) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = {
          ...last,
          isStreamingCoach: true,
          coachEvaluation: '',
        };
        return copy;
      });

      aiAnswerEngine.evaluateAnswer(precedingQuestion, candidateSpoken, turnsRef.current);
      scrollToBottom();
    });

    // 4. Subscribe to AI Answer streaming callbacks
    const unsubToken = aiAnswerEngine.onToken((_token, fullText) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        // Find active streaming copilot turn
        const idx = copy.findIndex((t) => t.isStreamingCopilot);
        const targetIdx = idx >= 0 ? idx : copy.length - 1;
        copy[targetIdx] = {
          ...copy[targetIdx],
          copilotAnswer: fullText,
          isStreamingCopilot: true,
        };
        return copy;
      });
      scrollToBottom();
    });

    const unsubComplete = aiAnswerEngine.onComplete((fullText) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const idx = copy.findIndex((t) => t.isStreamingCopilot);
        const targetIdx = idx >= 0 ? idx : copy.length - 1;
        copy[targetIdx] = {
          ...copy[targetIdx],
          copilotAnswer: fullText,
          isStreamingCopilot: false,
        };
        return copy;
      });

      // Save AI answer to rolling history
      turnsRef.current.push({
        id: `ai-${Date.now()}`,
        role: 'ai_suggestion',
        text: fullText,
        timestamp: Date.now(),
      });
      scrollToBottom();
    });

    const unsubError = aiAnswerEngine.onError((err) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const idx = copy.findIndex((t) => t.isStreamingCopilot);
        const targetIdx = idx >= 0 ? idx : copy.length - 1;
        copy[targetIdx] = {
          ...copy[targetIdx],
          error: err,
          isStreamingCopilot: false,
        };
        return copy;
      });
    });

    // 5. Subscribe to Evaluation streaming callbacks
    const unsubEvalToken = aiAnswerEngine.onEvaluationToken((_token, fullText) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const idx = copy.findIndex((t) => t.isStreamingCoach);
        const targetIdx = idx >= 0 ? idx : copy.length - 1;
        copy[targetIdx] = {
          ...copy[targetIdx],
          coachEvaluation: fullText,
          isStreamingCoach: true,
        };
        return copy;
      });
      scrollToBottom();
    });

    const unsubEvalComplete = aiAnswerEngine.onEvaluationComplete((fullText) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const idx = copy.findIndex((t) => t.isStreamingCoach);
        const targetIdx = idx >= 0 ? idx : copy.length - 1;
        copy[targetIdx] = {
          ...copy[targetIdx],
          coachEvaluation: fullText,
          isStreamingCoach: false,
        };
        return copy;
      });

      turnsRef.current.push({
        id: `eval-${Date.now()}`,
        role: 'ai_suggestion',
        text: fullText,
        timestamp: Date.now(),
      });
      scrollToBottom();
    });

    const unsubEvalError = aiAnswerEngine.onEvaluationError((err) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const idx = copy.findIndex((t) => t.isStreamingCoach);
        const targetIdx = idx >= 0 ? idx : copy.length - 1;
        copy[targetIdx] = {
          ...copy[targetIdx],
          error: err,
          isStreamingCoach: false,
        };
        return copy;
      });
    });

    // 6. Subscribe to Local Whisper status
    const unsubStatus = localWhisperClient.onStatusChange((status, message) => {
      setSttStatus(status);
      if (message) setStatusMessage(message);
    });

    // 7. Audio levels
    const unsubLevels = audioMultiplexer.onAudioLevels((levels) => {
      setAudioLevels(levels);
    });

    // 8. Audio data piping to local Whisper
    const unsubData = audioMultiplexer.onAudioData((chunk) => {
      localWhisperClient.sendAudio(chunk);
    });

    // Auto-start audio pipeline if not already running
    startListening();

    // 9. Hotkey listener for toggle_live_copilot
    let unsubHotkey: (() => void) | undefined;
    if (window.electronAPI?.onHotkeyPressed) {
      unsubHotkey = window.electronAPI.onHotkeyPressed((action) => {
        if (action === 'toggle_live_copilot') {
          handleClearContext();
          if (!isListening) startListening();
        } else if (action === 'clear_chat') {
          handleClearContext();
        } else if (action === 'ask_ai') {
          handleSolveScreen();
        } else if (action === 'manual_ask') {
          questionDetector.triggerManual();
        }
      });
    }

    return () => {
      unsubTranscript();
      unsubQuestion();
      unsubCandidateAnswer();
      unsubToken();
      unsubComplete();
      unsubError();
      unsubEvalToken();
      unsubEvalComplete();
      unsubEvalError();
      unsubStatus();
      unsubLevels();
      unsubData();
      if (unsubHotkey) unsubHotkey();
    };
  }, []);

  const startListening = async () => {
    try {
      setStatusError(null);
      const loopbackStream = await audioCaptureService.startLoopbackCapture();
      const micStream = await audioCaptureService.startMicrophoneCapture(selectedMicId || undefined);

      await localWhisperClient.initialize();
      await audioMultiplexer.start(loopbackStream, micStream);
      setIsListening(true);
      setIsMicPaused(false);
    } catch (err: any) {
      console.warn('Live audio start warning:', err);
      setStatusError(err.message || 'Failed to capture audio');
    }
  };

  const handleToggleMic = () => {
    if (isMicPaused) {
      audioMultiplexer.resume();
      setIsMicPaused(false);
    } else {
      audioMultiplexer.pause();
      setIsMicPaused(true);
    }
  };

  const handleSolveScreen = () => {
    const qId = `vision-q-${Date.now()}`;
    const turnId = `vision-turn-${Date.now()}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const questionText = 'Captured On-Screen Problem (DSA / LeetCode / IDE)';
    turnsRef.current.push({
      id: qId,
      role: 'interviewer',
      text: questionText,
      timestamp: Date.now(),
    });

    questionDetector.setLastActiveQuestion(questionText);

    const newTurn: SandwichTurn = {
      id: turnId,
      interviewerQuestion: questionText,
      interviewerTime: nowStr,
      questionSource: 'interviewer',
      copilotAnswer: '',
      copilotTime: nowStr,
      isStreamingCopilot: true,
      isVision: true,
      candidateSpoken: '',
      coachEvaluation: '',
      isStreamingCoach: false,
      error: null,
    };

    setTurns((prev) => [...prev, newTurn]);

    const unsubToken = visionSolverService.onToken((_tok, full) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const idx = copy.findIndex((t) => t.id === turnId);
        if (idx >= 0) {
          copy[idx] = {
            ...copy[idx],
            copilotAnswer: full,
            isStreamingCopilot: true,
          };
        }
        return copy;
      });
      scrollToBottom();
    });

    const unsubComplete = visionSolverService.onComplete((sol) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const idx = copy.findIndex((t) => t.id === turnId);
        if (idx >= 0) {
          copy[idx] = {
            ...copy[idx],
            copilotAnswer: sol.fullMarkdown,
            isStreamingCopilot: false,
          };
        }
        return copy;
      });

      turnsRef.current.push({
        id: `ai-${Date.now()}`,
        role: 'ai_suggestion',
        text: sol.fullMarkdown,
        timestamp: Date.now(),
      });
      promptEngine.injectSolvedCodeContext(sol.fullMarkdown);
      unsubToken();
      unsubComplete();
      scrollToBottom();
    });

    const unsubError = visionSolverService.onError((err) => {
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const idx = copy.findIndex((t) => t.id === turnId);
        if (idx >= 0) {
          copy[idx] = {
            ...copy[idx],
            error: err,
            isStreamingCopilot: false,
          };
        }
        return copy;
      });
      unsubToken();
      unsubError();
    });

    visionSolverService.captureAndSolve('C++');
    onSolveScreen?.();
    scrollToBottom();
  };

  const handleClearContext = () => {
    aiAnswerEngine.cancel();
    visionSolverService.cancel();
    setTurns([]);
    turnsRef.current = [];
    questionDetector.clearHistory();
    onClearContext?.();
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Slimline Live Controls Header Bar (Height ~28px) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          padding: '2px 6px',
          borderRadius: '6px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: '8px',
          gap: '6px',
        }}
      >
        {/* Left Side: Mic status & Compact VU Meters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={handleToggleMic}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 600,
              cursor: 'pointer',
              background: isMicPaused ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: isMicPaused ? '#f87171' : '#34d399',
              border: isMicPaused ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
            }}
            title={isMicPaused ? 'Resume Mic Capture' : `Mic: Live (STT ${sttStatus}: ${statusMessage})`}
          >
            {isMicPaused ? <MicOff size={10} /> : <Mic size={10} />}
            <span>{isMicPaused ? 'PAUSED' : 'LIVE'}</span>
          </button>

          {/* Compact VU Meters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Interviewer VU */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Caller / Interviewer Audio Level">
              <span style={{ fontSize: '8.5px', color: '#38bdf8', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>CALL</span>
              <div style={{ width: '22px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, audioLevels.interviewerLevel * 100)}%`,
                    height: '100%',
                    background: '#38bdf8',
                  }}
                />
              </div>
            </div>

            {/* Candidate VU */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Your Microphone Level">
              <span style={{ fontSize: '8.5px', color: '#a78bfa', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>YOU</span>
              <div style={{ width: '22px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, audioLevels.candidateLevel * 100)}%`,
                    height: '100%',
                    background: '#a78bfa',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Solve Screen Button */}
          <button
            onClick={handleSolveScreen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(59, 130, 246, 0.25)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.45)',
            }}
            title="Silent Screen Problem Solver (Ctrl+Shift+H)"
          >
            <Camera size={10} />
            <span>SOLVE (Ctrl+Shift+H)</span>
          </button>

          {/* Clear Chat Button */}
          <button
            onClick={handleClearContext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 500,
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title="Clear Chat & Reset Memory (Ctrl+Shift+X)"
          >
            <Trash2 size={10} />
            <span>CLEAR (Ctrl+Shift+X)</span>
          </button>

          {/* Click-Through Toggle */}
          <button
            onClick={onToggleClickThrough}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 5px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 500,
              cursor: 'pointer',
              background: isClickThrough ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: isClickThrough ? '#34d399' : '#94a3b8',
              border: isClickThrough ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title="Pass Mouse Clicks through to IDE (Ctrl+Shift+M)"
          >
            <MousePointer size={9} />
            <span>{isClickThrough ? 'PASS-ON' : 'PASS'}</span>
          </button>
        </div>
      </div>

      {/* ── Status Error Banner if any ── */}
      {statusError && (
        <div
          style={{
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            fontSize: '10.5px',
            fontFamily: 'ui-monospace, monospace',
            marginBottom: '6px',
          }}
        >
          {statusError}
        </div>
      )}

      {/* ── Terminal-Style Infinite Canvas Buffer ── */}
      <div
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {turns.length === 0 ? (
          /* Empty / Initial State */
          <div
            style={{
              padding: '24px 16px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.3)',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              color: '#94a3b8',
              fontSize: '11.5px',
              lineHeight: 1.6,
            }}
          >
            <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} color="#34d399" />
              <span>GHOSTPILOT TERMINAL BUFFER READY</span>
            </div>
            <div>&gt; Listening to caller &amp; candidate audio stream.</div>
            <div>&gt; Ask or clarify a topic to trigger immediate C++ solutions.</div>
            <div>&gt; Spoken explanations are evaluated live with edge-case coaching.</div>
            <div>&gt; Press <strong style={{ color: '#60a5fa' }}>Ctrl+Shift+H</strong> to solve code directly from screen.</div>
          </div>
        ) : (
          turns.map((turn, idx) => {
            const isLast = idx === turns.length - 1;
            const accentColor = turn.isVision ? '#60a5fa' : '#34d399';

            return (
              <div
                key={turn.id}
                style={{
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingBottom: '12px',
                  marginBottom: '12px',
                  borderBottom: isLast ? 'none' : '1px dashed rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* 1. Top Slice: Interviewer Question / Clarified Topic */}
                {turn.interviewerQuestion && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span
                        style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#38bdf8', // Sky Blue
                          letterSpacing: '0.04em',
                        }}
                      >
                        {turn.isVision
                          ? '> VISION PROBLEM'
                          : turn.questionSource === 'candidate'
                          ? '> TOPIC CLARIFIED'
                          : '> INTERVIEWER'}{' '}
                        [{turn.interviewerTime}]:
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        color: '#f8fafc',
                        paddingLeft: '10px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {turn.interviewerQuestion}
                    </div>
                  </div>
                )}

                {/* 2. Middle Slice: Copilot Answer & Code */}
                {(turn.copilotAnswer || turn.isStreamingCopilot || turn.error) && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: accentColor,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {turn.isVision ? '> VISION SOLVER [C++]' : '> COPILOT [C++]'}:
                        </span>
                        {turn.isStreamingCopilot && (
                          <span
                            style={{
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '10px',
                              color: '#fbbf24',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <RefreshCw size={10} className="animate-spin" /> {turn.isVision ? 'solving...' : 'streaming...'}
                          </span>
                        )}
                      </div>
                      {turn.copilotAnswer && (
                        <button
                          onClick={() => handleCopyText(turn.id, turn.copilotAnswer)}
                          style={{
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: copiedId === turn.id ? '#34d399' : '#cbd5e1',
                            fontSize: '9.5px',
                            fontFamily: 'ui-monospace, monospace',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title="Copy Answer & Code"
                        >
                          {copiedId === turn.id ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copiedId === turn.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    {turn.error ? (
                      <div
                        style={{
                          color: '#f87171',
                          fontSize: '11.5px',
                          paddingLeft: '10px',
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        Error: {turn.error}
                      </div>
                    ) : turn.copilotAnswer ? (
                      <div style={{ paddingLeft: '4px' }}>
                        <MarkdownView md={turn.copilotAnswer} accentColor={accentColor} />
                      </div>
                    ) : (
                      <div
                        style={{
                          color: '#64748b',
                          fontSize: '11px',
                          paddingLeft: '10px',
                          fontStyle: 'italic',
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        {turn.isVision ? 'Capturing screen and solving problem...' : 'Formulating optimal solution...'}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Bottom Slice: Spoken Candidate Speech + Coach Evaluation */}
                {(turn.candidateSpoken || turn.coachEvaluation || turn.isStreamingCoach) && (
                  <div
                    style={{
                      marginTop: '6px',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* What You Spoke */}
                    {turn.candidateSpoken && (
                      <div style={{ marginBottom: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#a78bfa', // Violet
                            letterSpacing: '0.04em',
                          }}
                        >
                          &gt; YOU [{turn.candidateTime || 'mic'}]:
                        </span>
                        <div
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '11.5px',
                            lineHeight: 1.5,
                            color: '#e2e8f0',
                            paddingLeft: '10px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {turn.candidateSpoken}
                        </div>
                      </div>
                    )}

                    {/* Coach Evaluation */}
                    {(turn.coachEvaluation || turn.isStreamingCoach) && (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span
                            style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#fbbf24', // Amber
                              letterSpacing: '0.04em',
                            }}
                          >
                            &gt; COACH:
                          </span>
                          {turn.isStreamingCoach && (
                            <span
                              style={{
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: '10px',
                                color: '#fbbf24',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <RefreshCw size={9} className="animate-spin" /> evaluating...
                            </span>
                          )}
                        </div>

                        {turn.coachEvaluation ? (
                          <div style={{ paddingLeft: '4px' }}>
                            <MarkdownView md={turn.coachEvaluation} accentColor="#fbbf24" />
                          </div>
                        ) : (
                          <div
                            style={{
                              color: '#64748b',
                              fontSize: '11px',
                              paddingLeft: '10px',
                              fontStyle: 'italic',
                              fontFamily: 'ui-monospace, monospace',
                            }}
                          >
                            Evaluating spoken answer against key concepts &amp; next points...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Generous 56px bottom clearance spacer so lines never hit or get clipped by the bottom bezel */}
        <div style={{ height: '56px', width: '100%', flexShrink: 0 }} />
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default LiveCopilotFeed;
