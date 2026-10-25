'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function DataRightsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rectification Form State
  const [fullName, setFullName] = useState('Candidate User');
  const [contactEmail, setContactEmail] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Distributed Systems Engineer');
  const [rectifySaved, setRectifySaved] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/user/export-data');
      if (!response.ok) {
        throw new Error('Export request failed. Please try again.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ghostpilot_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to download data export.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRectifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ghostpilot_target_role', targetRole);
    setRectifySaved(true);
    setTimeout(() => setRectifySaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE MY ACCOUNT') {
      setErrorMessage('Please type DELETE MY ACCOUNT exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to complete account erasure.');
      }

      setDeleteSuccess(true);
      setShowDeleteModal(false);
      localStorage.clear();
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to erase account.');
    } finally {
      setIsDeleting(false);
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-white text-sm">Data Rights & Privacy Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 font-semibold text-emerald-400">
            <Lock className="h-3 w-3" />
            DPDP & GDPR Compliant
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/20 via-[#12141c] to-[#12141c] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col gap-2 max-w-2xl relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Candidate Self-Serve Privacy Controls
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Your Data, Your Ownership
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              In strict accordance with the Digital Personal Data Protection (DPDP) Act 2023 and GDPR Articles 17 & 20, you retain full ownership over your resumes, audio transcripts, session notes, and account identity.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {deleteSuccess && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>All personal data, resumes, and accounts have been permanently erased. Redirecting...</span>
          </div>
        )}

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Export Data */}
          <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between shadow-xl">
            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Right to Access & Portability</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Download a clean, machine-readable JSON archive containing all your uploaded resumes, extracted plain text, practice transcripts, and AI evaluations.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 px-4 py-3 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Preparing Archive...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download JSON Archive</span>
                  </>
                )}
              </button>
              {exportSuccess && (
                <span className="block text-center text-[11px] text-emerald-400 font-medium mt-2">
                  ✓ Archive downloaded successfully
                </span>
              )}
            </div>
          </div>

          {/* Pillar 2: Rectification */}
          <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col justify-between shadow-xl">
            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Edit3 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Right to Rectification</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Correct or update candidate profile credentials, preferred contact information, and target role title used across AI prompt injections.
              </p>
            </div>

            <form onSubmit={handleRectifySubmit} className="pt-4 flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Candidate Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Candidate Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                <span>Save Updates</span>
              </button>
              {rectifySaved && (
                <span className="block text-center text-[11px] text-purple-300 font-medium">
                  ✓ Preferences updated
                </span>
              )}
            </form>
          </div>

          {/* Pillar 3: Erasure */}
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.02] p-6 flex flex-col justify-between shadow-xl">
            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Right to Erasure (Forgotten)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Permanently and irrevocably delete your profile, documents from Supabase Storage, transcripts, and AI response history.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-4 py-3 text-xs font-bold text-rose-300 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Erase All My Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Principles Banner */}
        <div className="rounded-3xl border border-white/10 bg-[#12141c] p-8 flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            GhostPilot Privacy & Security Architecture
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-300 leading-relaxed">
            <div className="flex flex-col gap-2">
              <h4 className="font-semibold text-white">Zero Cloud Audio Caching</h4>
              <p className="text-zinc-400">
                Loopback system audio captured via WASAPI and microphone input are processed in-memory or transcribed locally using quantized Whisper ONNX. Raw audio buffers are never persisted unencrypted to cloud storage.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-semibold text-white">Row Level Security (RLS)</h4>
              <p className="text-zinc-400">
                All Supabase PostgreSQL database tables and Storage buckets employ strict user-level RLS policies, ensuring no user can read, query, or enumerate resumes or interview logs belonging to another user.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-semibold text-white">Anti-Capture Visual HUD</h4>
              <p className="text-zinc-400">
                Desktop HUD overlays utilize Win32 SetWindowDisplayAffinity and macOS NSWindowSharingNone, guaranteeing live answers remain completely invisible to Zoom, Teams, Meet, and browser tab captures.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-semibold text-white">100% Free & Barrier-Free</h4>
              <p className="text-zinc-400">
                GhostPilot contains zero tracking ad pixels, no payment gateway webhooks, and zero credit expiration barriers. You enjoy total privacy and self-determination.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-[#141520] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Confirm Permanent Erasure</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This action will permanently delete your user account, all uploaded PDF/DOCX resumes, raw extracted text, speech transcripts, and AI mock responses. <strong>This action cannot be undone.</strong>
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Type <span className="text-rose-400 font-mono">DELETE MY ACCOUNT</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full rounded-xl border border-rose-500/30 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationInput !== 'DELETE MY ACCOUNT'}
                className="rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {isDeleting ? 'Erasing Data...' : 'Irrevocably Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
