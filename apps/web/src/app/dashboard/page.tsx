import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { LaunchDesktopButton } from '@/components/LaunchDesktopButton';
import { Sparkles, Coins, ShieldCheck, LogOut, FileText, Play } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Query profile from database
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const email = user?.email || 'candidate@parakeet-ai.com';
  const credits = profile?.credits_balance ?? 50;
  const tier = profile?.plan_tier ?? 'free';

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f5]">
      {/* Dashboard Topbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#090a0f]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Parakeet AI</span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 capitalize">
            {tier} Tier
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold">
            <Coins className="h-4 w-4 text-emerald-400" />
            <span>{credits} Credits</span>
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
              Connected as <strong className="text-zinc-200">{email}</strong>. Ready for real-time live assistance.
            </p>
          </div>

          <div className="w-full md:w-auto">
            <LaunchDesktopButton />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stealth Overlay Controller Card */}
          <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                <ShieldCheck className="h-5 w-5" />
                <span>Stealth Overlay HUD</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Invisible to Zoom, Teams, Meet screen shares (`WDA_EXCLUDEFROMCAPTURE`). Global hotkeys control visibility without causing focus blur.
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
                Configure your upcoming interview, coding test, or mock call to calibrate real-time transcription and prompt context.
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
              <span className="text-xs text-zinc-500">Requires 1 credit per minute of active transcription</span>
              <button className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white transition-colors">
                Configure Session Context
              </button>
            </div>
          </div>
        </div>

        {/* Vault Quick Links */}
        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-semibold text-white">
              <FileText className="h-5 w-5 text-emerald-400" />
              <span>Resume & Context Vault</span>
            </div>
            <span className="text-xs text-zinc-400">0 documents uploaded</span>
          </div>
          <p className="text-xs text-zinc-400">
            Upload your resume (PDF/DOCX) in Phase 5 to enable personalized interview answer generation referencing your real background.
          </p>
        </div>
      </main>
    </div>
  );
}
