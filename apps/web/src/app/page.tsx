import Link from 'next/link';
import { Sparkles, Shield, Cpu, Mic, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-[#090a0f]/80 px-6 backdrop-blur-md max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Parakeet AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Try for Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>#1 Undetectable Real-Time AI Interview Copilot</span>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-balance">
          Ace Live Interviews with <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Sub-Second Stealth AI
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed">
          Floating desktop HUD completely invisible to Zoom, Teams, and Google Meet screen shares. Captures caller loopback audio without banners and streams real-time talking points and coding solutions from Claude.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:scale-105"
          >
            <span>Launch Copilot Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-base font-medium text-zinc-300 transition-colors hover:bg-white/10"
          >
            Explore Stealth Architecture
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <section id="features" className="mt-24 grid w-full grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">100% Invisible to Capture</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Window affinity API (WDA_EXCLUDEFROMCAPTURE) ensures video conference tools look straight through the overlay.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Dual-Channel Loopback Audio</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Captures caller loopback voice and mic streams natively to Deepgram Nova-2 with speaker diarization and zero Chrome sharing bars.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Silent Vision Coding Solver</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Silent in-memory screenshot hotkey solves LeetCode and system design questions with code and time/space complexity analysis.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
