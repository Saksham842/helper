'use client';

import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Copy } from 'lucide-react';

export function LaunchDesktopButton() {
  const [loading, setLoading] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [tokenFallback, setTokenFallback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLaunch() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/desktop-token', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to generate desktop authentication token');
      }

      const data = await res.json();
      setTokenFallback(data.token);
      setLaunched(true);

      // Trigger custom protocol handoff
      if (data.launchUrl) {
        window.location.href = data.launchUrl;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with desktop copilot');
    } finally {
      setLoading(false);
    }
  }

  function copyToken() {
    if (tokenFallback) {
      navigator.clipboard.writeText(tokenFallback);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleLaunch}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 disabled:opacity-50"
      >
        <ExternalLink className="h-4 w-4" />
        <span>{loading ? 'Preparing Token...' : 'Launch Desktop Copilot'}</span>
      </button>

      {launched && (
        <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Launch signal sent to desktop app!</span>
          </div>
          <p className="mt-1 text-zinc-400">
            If the desktop overlay did not open automatically, copy your token manually:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={tokenFallback || ''}
              className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-zinc-300 font-mono"
            />
            <button
              onClick={copyToken}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10"
            >
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
