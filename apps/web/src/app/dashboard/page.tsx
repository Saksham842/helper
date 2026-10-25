import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { LaunchDesktopButton } from '@/components/LaunchDesktopButton';
import { Sparkles, ShieldCheck, LogOut, FileText, Play, Bot, BookOpen, Infinity as InfinityIcon } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email || 'candidate@parakeet-ai.com';

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f5]">
      {/* Dashboard Topbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#090a0f]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Parakeet AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-zinc-400 ml-4">
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-white bg-white/5">
              Overview
            </Link>
            <Link href="/dashboard/vault" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
              Resume Vault
            </Link>
            <Link href="/dashboard/mock" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
              Mock Interviewer
            </Link>
            <Link href="/dashboard/questions" className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
              Question Bank
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
            <InfinityIcon className="h-4 w-4" />
            <span>100% Free & Unlimited</span>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/20 via-[#12141c] to-[#12141c] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Candidate Command Center
            </h1>
            <p className="text-sm text-zinc-400">
              Connected as <strong className="text-zinc-200">{email}</strong>. Ready for undetectable live assistance.
            </p>
          </div>

          <div className="w-full md:w-auto">
            <LaunchDesktopButton />
          </div>
        </div>

        {/* Navigation Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resume Vault Card */}
          <Link
            href="/dashboard/vault"
            className="group rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-[#151722] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <span>Resume & Context Vault</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Configured
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Upload your PDF or DOCX resume. Automated text extraction injects your genuine experience, metrics, and skills into live AI answers.
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>Open Document Vault &rarr;</span>
            </div>
          </Link>

          {/* Voice AI Mock Interviewer Card */}
          <Link
            href="/dashboard/mock"
            className="group rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-[#151722] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Bot className="h-5 w-5 text-teal-400" />
                  <span>AI Mock Interviewer</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                  Web Speech
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Practice technical and behavioral interviews with real-time voice synthesis and speech recognition—100% free in your browser.
              </p>
            </div>
            <div className="text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>Start Voice Simulation &rarr;</span>
            </div>
          </Link>

          {/* Personal Question Bank Card */}
          <Link
            href="/dashboard/questions"
            className="group rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-[#151722] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                  <span>Personal Question Bank</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                  Indexed
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Explore indexed technical interview questions from live calls with model answers, categorized by System Design, Algorithms, and Frontend.
              </p>
            </div>
            <div className="text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>Browse Question Bank &rarr;</span>
            </div>
          </Link>
        </div>

        {/* Dashboard Grid: HUD Stealth Status & Live Session */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stealth Overlay Controller Card */}
          <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                <ShieldCheck className="h-5 w-5" />
                <span>Stealth Overlay HUD</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Invisible to Zoom, Teams, and Meet screen shares via Win32 <code>WDA_EXCLUDEFROMCAPTURE</code> and macOS <code>NSWindowSharingNone</code>. Operates with zero focus loss.
              </p>
            </div>
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              HUD Status: <strong>Standby</strong> (Click Launch Desktop App to activate overlay)
            </div>
          </div>

          {/* Start New Session Card */}
          <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between md:col-span-2">
            <div>
              <div className="flex items-center gap-2 text-white font-semibold mb-3">
                <Play className="h-5 w-5 text-emerald-400" />
                <span>Start New Live Session</span>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Calibrate real-time transcription and prompt context for your upcoming technical interview or coding assessment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Session Title
                  </label>
                  <input
                    type="text"
                    defaultValue="Senior Full Stack Technical Interview"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Session Mode
                  </label>
                  <select
                    defaultValue="interview"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="interview" className="bg-[#12141c]">Technical Interview (DSA / System Design)</option>
                    <option value="general_call" className="bg-[#12141c]">General Professional Call</option>
                    <option value="mock" className="bg-[#12141c]">AI Voice Mock Interview</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-xs text-emerald-400 font-medium">100% Free & Unlimited Access</span>
              <Link
                href="/dashboard/vault"
                className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                Configure Resume Context
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
