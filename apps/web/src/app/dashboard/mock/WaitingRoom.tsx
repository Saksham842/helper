'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Shield,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface WaitingRoomProps {
  onReady: () => void;
  targetRole?: string;
  interviewTrack?: string;
}

interface Slide {
  badge: string;
  title: string;
  description: string;
  icon: string;
}

const TOUR_SLIDES: Slide[] = [
  {
    badge: 'Overview',
    title: 'The AI Mock Interview Room',
    description:
      'Your practice session runs on one unified screen: your AI interviewer speaks questions aloud, your voice input is transcribed in real-time, and live pace/filler analytics assist your delivery.',
    icon: '🎯',
  },
  {
    badge: 'AI Avatar',
    title: 'Natural Voice Dialogue',
    description:
      'The voice simulator uses browser Web Speech speech synthesis. When she finishes speaking, answer naturally into your microphone. If preferred, you can also type answers.',
    icon: '🎙️',
  },
  {
    badge: 'Fair-Play & Proctoring',
    title: 'Simulated Assessment Strictness',
    description:
      'To prepare you for proctored rounds (HireVue, Codility, HackerRank), GhostPilot can detect tab-switching, focus loss, and window blur, reporting fair-play scorecards.',
    icon: '🛡️',
  },
  {
    badge: 'Post-Call Intelligence',
    title: 'Executive Scorecard & STAR Breakdown',
    description:
      'Immediately upon concluding, Groq Llama 3.3 evaluates your responses against industry rubrics: technical specificity, STAR structure, speaking tempo, and filler reduction.',
    icon: '📊',
  },
];

export function WaitingRoom({ onReady, targetRole = 'Software Engineer', interviewTrack = 'Full Stack' }: WaitingRoomProps) {
  // Device states
  const [micActive, setMicActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [cameraActive, setCameraActive] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Slide carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Microphone & Audio Meter
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initMic() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaStreamRef.current = stream;
        setMicActive(true);
        setPermissionError(null);

        // Web Audio Analyser
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale to 0-100 range with sensitivity boost
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (err: any) {
        console.warn('[WaitingRoom] Mic access denied:', err);
        setPermissionError('Microphone permission required for voice practice.');
        setMicActive(false);
      }
    }

    initMic();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Toggle Camera
  const toggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    } else {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = camStream;
        }
        setCameraActive(true);
      } catch (err) {
        console.warn('[WaitingRoom] Camera error:', err);
      }
    }
  };

  // Test Speaker chime via Web Audio synth
  const testSpeaker = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setSpeakerTested(true);
    } catch (err) {
      console.warn('Audio test error:', err);
    }
  };

  const handleStart = () => {
    // Stop local video preview if open before launching room
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    onReady();
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 py-6">
      {/* Header Info */}
      <div className="text-center flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          Pre-Interview Readiness Check
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Ready to Begin Your Mock Interview?
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg">
          Target Role: <strong className="text-zinc-200">{targetRole}</strong> • Track:{' '}
          <strong className="text-zinc-200">{interviewTrack}</strong>
        </p>
      </div>

      {/* Grid: Left = Hardware Tech Check, Right = Walkthrough Tour */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Tech Check Panel */}
        <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Device Tech Readiness
            </h3>
            <span className="text-[11px] text-zinc-500">Local System Check</span>
          </div>

          {/* Microphone Check & Level Meter */}
          <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    micActive
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Microphone</h4>
                  <span className="text-[11px] text-zinc-400">
                    {micActive ? 'Input stream active — speak to test' : 'Access blocked'}
                  </span>
                </div>
              </div>
              {micActive ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              )}
            </div>

            {/* Audio VU Visualizer Bar */}
            <div className="mt-2 flex items-center gap-1.5 h-3 w-full bg-black/40 rounded-full p-0.5 border border-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                style={{ width: `${Math.max(4, audioLevel)}%` }}
              />
            </div>
            {permissionError && (
              <span className="text-[11px] text-rose-400 mt-1">{permissionError}</span>
            )}
          </div>

          {/* Speaker Test */}
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  speakerTested
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-zinc-400'
                }`}
              >
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Sound Output</h4>
                <span className="text-[11px] text-zinc-400">
                  {speakerTested ? 'Sound verified' : 'Test interviewer audio chime'}
                </span>
              </div>
            </div>
            <button
              onClick={testSpeaker}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            >
              Test Sound
            </button>
          </div>

          {/* Camera Optional Preview */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    cameraActive
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  {cameraActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Camera Mirror (Optional)</h4>
                  <span className="text-[11px] text-zinc-400">
                    {cameraActive ? 'Camera preview running' : 'Disabled (practice voice-only or with video)'}
                  </span>
                </div>
              </div>
              <button
                onClick={toggleCamera}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
              >
                {cameraActive ? 'Turn Off' : 'Preview'}
              </button>
            </div>

            {cameraActive && (
              <div className="rounded-xl overflow-hidden aspect-video bg-black/60 border border-white/10 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Room Tour & Guidelines Carousel */}
        <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                {TOUR_SLIDES[currentSlide].badge}
              </span>
              <span className="text-[11px] text-zinc-500">
                Slide {currentSlide + 1} of {TOUR_SLIDES.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 py-4 min-h-[160px]">
              <div className="text-3xl">{TOUR_SLIDES[currentSlide].icon}</div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {TOUR_SLIDES[currentSlide].title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {TOUR_SLIDES[currentSlide].description}
              </p>
            </div>
          </div>

          {/* Carousel Navigation */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-1.5">
              {TOUR_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentSlide === i ? 'w-6 bg-purple-400' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentSlide === 0}
                onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentSlide === TOUR_SLIDES.length - 1}
                onClick={() => setCurrentSlide((p) => Math.min(TOUR_SLIDES.length - 1, p + 1))}
                className="p-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          onClick={handleStart}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Play className="h-4 w-4 fill-black" />
          <span>Enter Mock Interview Room</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
