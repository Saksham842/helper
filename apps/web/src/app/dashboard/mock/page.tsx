'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  ArrowLeft,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  User,
  Radio,
} from 'lucide-react';

interface TranscriptItem {
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: number;
}

export default function MockInterviewPage() {
  const [selectedTrack, setSelectedTrack] = useState<string>('System Design & Architecture');
  const [difficulty, setDifficulty] = useState<string>('Senior');
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isCandidateListening, setIsCandidateListening] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [resumeContext, setResumeContext] = useState<string>('');

  const [history, setHistory] = useState<TranscriptItem[]>([]);
  const [currentCandidateInput, setCurrentCandidateInput] = useState<string>('');
  const [isGeneratingNext, setIsGeneratingNext] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [scorecardResult, setScorecardResult] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Load active resume context from vault
  useEffect(() => {
    fetch('/api/vault/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.extractedText) {
          setResumeContext(data.extractedText);
        }
      })
      .catch((err) => console.warn('[Mock] Failed to load resume context:', err));
  }, []);

  // Scroll to bottom when history updates
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, currentCandidateInput]);

  // Clean up speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Synthesize speech using native Web Speech Synthesis API
  const speakText = (text: string, onEnd?: () => void) => {
    if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsAiSpeaking(true);
    };

    utterance.onend = () => {
      setIsAiSpeaking(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setIsAiSpeaking(false);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Toggle browser SpeechRecognition for candidate speech
  const toggleCandidateMic = () => {
    if (isCandidateListening) {
      stopCandidateMic();
    } else {
      startCandidateMic();
    }
  };

  const startCandidateMic = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support the Web Speech API. You can type your responses in the input box below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsCandidateListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            setCurrentCandidateInput((prev) => (prev ? prev + ' ' : '') + event.results[i][0].transcript);
          } else {
            interim += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('[Web Speech Error]:', e);
        setIsCandidateListening(false);
      };

      recognition.onend = () => {
        setIsCandidateListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[Web Speech Init Error]:', err);
      setIsCandidateListening(false);
    }
  };

  const stopCandidateMic = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsCandidateListening(false);
  };

  const handleStartInterview = async () => {
    setIsStarted(true);
    setHistory([]);
    setScorecardResult(null);

    const initialPrompts: Record<string, string> = {
      'System Design & Architecture':
        "Welcome to your System Design evaluation. Let's design a high-throughput, low-latency URL shortening service like Bit.ly that handles 50,000 write requests per second. How would you approach the core architecture and data storage?",
      'Frontend & Full-Stack':
        "Hello! In this technical session, we will focus on modern frontend architecture and React performance. Can you explain how you would design an infinite virtualized list component supporting 100,000 dynamic items with 60fps scrolling?",
      'Algorithms & Problem Solving':
        "Welcome! We'll begin with a data structures challenge. Suppose you have an incoming stream of integers. How would you design a data structure that efficiently returns the median element at any point in O(1) or O(log N) time?",
      'Behavioral & Leadership':
        "Welcome to your leadership and behavioral interview. To start, walk me through a challenging production incident or architectural disagreement you managed, and explain the steps you took to achieve alignment.",
    };

    const firstQuestion =
      initialPrompts[selectedTrack] ||
      "Hello! Let's begin the interview. Can you introduce yourself and describe a recent complex system you designed?";

    const firstItem: TranscriptItem = {
      speaker: 'interviewer',
      text: firstQuestion,
      timestamp: Date.now(),
    };

    setHistory([firstItem]);
    speakText(firstQuestion, () => {
      // Prompt candidate to speak
      startCandidateMic();
    });
  };

  const handleSendAnswer = async () => {
    if (!currentCandidateInput.trim() || isGeneratingNext) return;

    stopCandidateMic();

    const candidateText = currentCandidateInput.trim();
    setCurrentCandidateInput('');

    const candidateMsg: TranscriptItem = {
      speaker: 'candidate',
      text: candidateText,
      timestamp: Date.now(),
    };

    const newHistory = [...history, candidateMsg];
    setHistory(newHistory);
    setIsGeneratingNext(true);

    try {
      const res = await fetch('/api/mock/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: selectedTrack,
          role: 'Full Stack Engineer',
          difficulty,
          history: newHistory,
          resumeText: resumeContext,
        }),
      });

      const data = await res.json();
      const nextQuestion = data.nextQuestion || "Can you elaborate further on the architectural tradeoffs of that decision?";

      const aiMsg: TranscriptItem = {
        speaker: 'interviewer',
        text: nextQuestion,
        timestamp: Date.now(),
      };

      setHistory([...newHistory, aiMsg]);
      speakText(nextQuestion, () => {
        startCandidateMic();
      });
    } catch (err) {
      console.error('[Mock Next Question Error]:', err);
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const handleFinishInterview = async () => {
    stopCandidateMic();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsFinishing(true);

    try {
      const res = await fetch('/api/mock/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: selectedTrack,
          role: 'Software Engineer',
          difficulty,
          history,
          resumeText: resumeContext,
        }),
      });

      const data = await res.json();
      setScorecardResult(data);
    } catch (err) {
      console.error('[Mock Finish Error]:', err);
    } finally {
      setIsFinishing(false);
      setIsStarted(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f5]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#090a0f]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-bold text-white text-sm">Voice AI Mock Interviewer</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
            title={soundEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <span className="rounded-full bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 text-xs font-semibold text-teal-400">
            100% Free Web Speech
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col gap-8">
        {!isStarted && !scorecardResult && (
          <div className="flex flex-col gap-8">
            {/* Setup Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-teal-950/20 via-[#12141c] to-[#12141c] p-6 md:p-8 shadow-xl">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Voice AI Technical Simulation
                  <Sparkles className="h-5 w-5 text-teal-400" />
                </h1>
                <p className="text-sm text-zinc-400 max-w-2xl">
                  Simulate high-stakes technical interviews with realistic spoken questions, adaptive follow-ups, and live voice recognition. Powered 100% in-browser by the native Web Speech API.
                </p>
              </div>

              <button
                onClick={handleStartInterview}
                className="w-full md:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-400 px-6 py-3.5 text-sm font-bold text-black shadow-lg hover:brightness-110 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-black" />
                <span>Start Simulation Round</span>
              </button>
            </div>

            {/* Track & Parameter Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tracks */}
              <div className="md:col-span-2 rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Select Interview Domain
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'System Design & Architecture',
                      desc: 'Distributed systems, scaling, microservices, and database sharding.',
                    },
                    {
                      id: 'Frontend & Full-Stack',
                      desc: 'React 19, web performance, offline architectures, and state machines.',
                    },
                    {
                      id: 'Algorithms & Problem Solving',
                      desc: 'Data structures, complexity tradeoffs, dynamic programming, and graphs.',
                    },
                    {
                      id: 'Behavioral & Leadership',
                      desc: 'STAR method, conflict management, cross-functional delivery, and mentorship.',
                    },
                  ].map((track) => (
                    <button
                      key={track.id}
                      onClick={() => setSelectedTrack(track.id)}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        selectedTrack === track.id
                          ? 'border-teal-500/50 bg-teal-500/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-sm font-bold text-white mb-1">{track.id}</div>
                      <div className="text-xs text-zinc-400 leading-relaxed">{track.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Resume Status */}
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                    Seniority Level
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Mid-Level', 'Senior', 'Staff', 'Principal'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                          difficulty === lvl
                            ? 'border-teal-500/40 bg-teal-500/10 text-teal-300'
                            : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                    <span className="text-xs font-medium text-zinc-400">Resume Context</span>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {resumeContext
                          ? 'Active resume loaded from Document Vault'
                          : 'Default general engineering context active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#12141c]/50 p-6 text-xs text-zinc-400 leading-relaxed flex flex-col gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-teal-400" />
                    Audio Hardware Notice
                  </span>
                  <span>
                    When the simulation begins, the AI will speak via your speakers and transcribe your verbal responses using your browser microphone.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Active Interview Stage */}
        {isStarted && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Voice Stage (1 Col) */}
            <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col items-center justify-between text-center gap-6 shadow-xl">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  {selectedTrack}
                </span>
                <span className="rounded-full bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                  {difficulty}
                </span>
              </div>

              {/* Animated Voice Orb */}
              <div className="relative flex items-center justify-center my-6">
                <div
                  className={`h-32 w-32 rounded-full transition-all duration-300 flex items-center justify-center shadow-2xl ${
                    isAiSpeaking
                      ? 'bg-gradient-to-tr from-teal-500 to-emerald-400 scale-110 shadow-teal-500/30 animate-pulse'
                      : isCandidateListening
                      ? 'bg-gradient-to-tr from-purple-500 to-pink-500 scale-105 shadow-purple-500/30'
                      : 'bg-zinc-800 scale-100 shadow-black'
                  }`}
                >
                  {isAiSpeaking ? (
                    <Volume2 className="h-12 w-12 text-black" />
                  ) : isCandidateListening ? (
                    <Mic className="h-12 w-12 text-white animate-bounce" />
                  ) : (
                    <Bot className="h-12 w-12 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Audio State Badge */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold text-white">
                  {isAiSpeaking
                    ? 'AI Interviewer Speaking...'
                    : isCandidateListening
                    ? 'Listening to Candidate...'
                    : 'Awaiting Response...'}
                </span>
                <span className="text-xs text-zinc-500">
                  {isAiSpeaking
                    ? 'Listen to the question'
                    : isCandidateListening
                    ? 'Speak clearly into your microphone'
                    : 'Click microphone or type your answer'}
                </span>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={toggleCandidateMic}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isCandidateListening
                      ? 'bg-rose-500 text-white shadow-rose-500/20'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {isCandidateListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  <span>{isCandidateListening ? 'Stop Microphone' : 'Start Speaking'}</span>
                </button>

                <button
                  onClick={handleFinishInterview}
                  disabled={isFinishing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-zinc-400 border border-white/10 transition-colors cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>{isFinishing ? 'Generating Scorecard...' : 'Finish & View Scorecard'}</span>
                </button>
              </div>
            </div>

            {/* Conversation Transcript Feed & Input (2 Cols) */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#12141c] flex flex-col justify-between overflow-hidden shadow-xl">
              {/* Transcript Timeline */}
              <div className="flex-1 max-h-[460px] overflow-y-auto p-6 flex flex-col gap-4">
                {history.map((item, idx) => {
                  const isInterviewer = item.speaker === 'interviewer';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col gap-1.5 max-w-[85%] ${
                        isInterviewer ? 'self-start' : 'self-end'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                          isInterviewer ? 'text-teal-400' : 'text-purple-400'
                        }`}
                      >
                        {isInterviewer ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                        <span>{isInterviewer ? 'AI Interviewer' : 'You (Candidate)'}</span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl text-xs leading-relaxed ${
                          isInterviewer
                            ? 'bg-teal-500/10 border border-teal-500/20 text-white rounded-tl-sm'
                            : 'bg-purple-500/10 border border-purple-500/20 text-white rounded-tr-sm'
                        }`}
                      >
                        {item.text}
                      </div>
                    </div>
                  );
                })}

                {isGeneratingNext && (
                  <div className="self-start flex items-center gap-2 text-xs text-teal-400 p-3 rounded-2xl bg-teal-500/5 border border-teal-500/10">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Evaluating answer & formulating follow-up...</span>
                  </div>
                )}

                <div ref={transcriptEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-black/30 border-t border-white/5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <textarea
                    rows={2}
                    value={currentCandidateInput}
                    onChange={(e) => setCurrentCandidateInput(e.target.value)}
                    placeholder="Type or speak your answer here..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white focus:border-teal-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAnswer();
                      }
                    }}
                  />

                  <button
                    onClick={handleSendAnswer}
                    disabled={!currentCandidateInput.trim() || isGeneratingNext}
                    className="h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                  <span>Speak via microphone or press Enter to submit answer</span>
                  <span>{history.filter((h) => h.speaker === 'candidate').length} answers recorded</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post-Session Scorecard Presentation */}
        {scorecardResult && (
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-teal-950/30 via-[#12141c] to-[#12141c] p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">
                  <Award className="h-4 w-4" />
                  <span>Interview Performance Scorecard</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {scorecardResult.track} ({scorecardResult.difficulty})
                </h2>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  {scorecardResult.summary}
                </p>
              </div>

              {/* Overall Score Badge */}
              <div className="flex flex-col items-center justify-center h-28 w-28 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-black shadow-xl flex-shrink-0">
                <span className="text-3xl font-black">{scorecardResult.scorecard.overall}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Overall Rating</span>
              </div>
            </div>

            {/* Rubric Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Technical Depth</span>
                  <span className="text-sm font-bold text-teal-400">
                    {scorecardResult.scorecard.technicalDepth}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full"
                    style={{ width: `${scorecardResult.scorecard.technicalDepth}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Communication & Clarity</span>
                  <span className="text-sm font-bold text-purple-400">
                    {scorecardResult.scorecard.communication}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full"
                    style={{ width: `${scorecardResult.scorecard.communication}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Problem Solving & Tradeoffs</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {scorecardResult.scorecard.problemSolving}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${scorecardResult.scorecard.problemSolving}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Strengths & Action Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Key Strengths
                </h4>
                <ul className="flex flex-col gap-2 text-xs text-zinc-300">
                  {scorecardResult.strengths?.map((str: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Recommended Action Items
                </h4>
                <ul className="flex flex-col gap-2 text-xs text-zinc-300">
                  {scorecardResult.actionItems?.map((act: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Questions Evaluated */}
            <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Detailed Question Critique & Model Answers
              </h3>

              <div className="flex flex-col gap-4">
                {scorecardResult.questions?.map((q: any) => (
                  <div key={q.id} className="rounded-2xl border border-white/5 bg-black/20 p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {q.question}
                      </h4>
                      <span className="rounded-full bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 text-xs font-bold text-teal-300 flex-shrink-0">
                        {q.score}% Score
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 leading-relaxed">
                      <strong className="text-zinc-300">Candidate Response:</strong> {q.candidateAnswer}
                    </div>

                    <div className="text-xs text-emerald-300/90 leading-relaxed bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                      <strong className="text-emerald-400">Model Answer:</strong> {q.modelAnswer}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setScorecardResult(null);
                  setIsStarted(false);
                }}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-bold text-white transition-colors"
              >
                Start Another Simulation
              </button>

              <Link
                href="/dashboard/questions"
                className="rounded-xl bg-teal-500 hover:bg-teal-400 px-5 py-2.5 text-xs font-bold text-black transition-colors"
              >
                View Question Bank &rarr;
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
