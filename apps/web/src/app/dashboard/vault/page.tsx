'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  FileCheck,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Info,
  Clock,
  Eye,
  Settings,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Linkedin,
  Briefcase,
} from 'lucide-react';
import { extractResumeIdentity, ResumeIdentityResult } from '@/lib/resumeIdentity';

interface VaultDocument {
  id: string;
  name: string;
  filePath: string;
  fileType: 'pdf' | 'docx';
  extractedText: string;
  createdAt: string;
  charCount?: number;
  wordCount?: number;
  identity?: ResumeIdentityResult;
}

export default function VaultPage() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);

  // Custom Prompt Directives
  const [targetRole, setTargetRole] = useState('Senior Full Stack / Systems Engineer');
  const [targetCompany, setTargetCompany] = useState('Google / Stripe');
  const [customInstructions, setCustomInstructions] = useState(
    'Answer in structured STAR format (Situation, Task, Action, Result). Highlight low-latency architectures, Golang/TypeScript, and trade-off considerations.'
  );
  const [savedSettings, setSavedSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load local stored directives if available
    const savedRole = localStorage.getItem('ghostpilot_target_role');
    const savedCompany = localStorage.getItem('ghostpilot_target_company');
    const savedInstructions = localStorage.getItem('ghostpilot_custom_instructions');

    if (savedRole) setTargetRole(savedRole);
    if (savedCompany) setTargetCompany(savedCompany);
    if (savedInstructions) setCustomInstructions(savedInstructions);

    // Fetch active resume from server
    fetch('/api/vault/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasActiveResume && data.document) {
          const extractedText = data.extractedText || '';
          const doc: VaultDocument = {
            id: data.document.id,
            name: data.document.name,
            filePath: data.document.filePath,
            fileType: data.document.fileType,
            extractedText,
            createdAt: data.document.createdAt,
            charCount: extractedText.length,
            wordCount: extractedText.split(/\s+/).filter(Boolean).length,
            identity: extractResumeIdentity(extractedText, data.document.name),
          };
          setDocuments([doc]);
          setActiveDocId(doc.id);
          setExpandedPreviewId(doc.id);
        }
      })
      .catch((err) => console.warn('[Vault] Failed to load active document:', err));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds maximum limit of 10MB.');
      return;
    }

    // Validate type
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx') && !name.endsWith('.doc')) {
      setUploadError('Only PDF and DOCX files are supported.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetRole', targetRole);
      formData.append('customInstructions', customInstructions);

      const response = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Upload failed');
      }

      const extractedText = result.document.extractedText || result.document.extracted_text || '';
      const newDoc: VaultDocument = {
        id: result.document.id,
        name: result.document.name,
        filePath: result.document.filePath || result.document.file_path,
        fileType: result.document.fileType || result.document.file_type,
        extractedText,
        createdAt: result.document.createdAt || result.document.created_at || new Date().toISOString(),
        charCount: result.stats?.charCount || extractedText.length,
        wordCount: result.stats?.wordCount || extractedText.split(/\s+/).filter(Boolean).length,
        identity: result.identity || extractResumeIdentity(extractedText, file.name),
      };

      setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
      setActiveDocId(newDoc.id);
      setExpandedPreviewId(newDoc.id);
      setUploadSuccess(`Successfully extracted ${newDoc.wordCount?.toLocaleString()} words from ${file.name}`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and extract document text.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveDirectives = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ghostpilot_target_role', targetRole);
    localStorage.setItem('ghostpilot_target_company', targetCompany);
    localStorage.setItem('ghostpilot_custom_instructions', customInstructions);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocId === id) {
      const remaining = documents.filter((d) => d.id !== id);
      setActiveDocId(remaining.length > 0 ? remaining[0].id : null);
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
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-bold text-white text-sm">Resume & Context Vault</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            Active Context Auto-Sync
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/20 via-[#12141c] to-[#12141c] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Resume Context Vault
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Upload your resume in PDF or DOCX format. Our server-side text engine extracts your real projects, metrics, and technical skills so the stealth desktop HUD generates answers tailored to your genuine background.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>Processed in-memory & stored with Supabase Row Level Security</span>
          </div>
        </div>

        {/* Upload Zone & Custom Instructions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Zone (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                  : 'border-white/15 bg-[#12141c]/60 hover:border-emerald-500/40 hover:bg-[#12141c]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-lg">
                <UploadCloud className="h-7 w-7" />
              </div>

              <h3 className="text-base font-semibold text-white mb-1">
                {isUploading ? 'Extracting Resume Text...' : 'Drop your Resume here or click to browse'}
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Supports PDF and DOCX files up to 10MB.
              </p>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5">.PDF</span>
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5">.DOCX</span>
                <span>• Instant Server-Side Text Extraction</span>
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-[#12141c]/90 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  <span className="text-xs font-medium text-emerald-400">Extracting text & sections...</span>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-3">
                <Info className="h-4 w-4 flex-shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Document Vault List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-400" />
                  Uploaded Documents ({documents.length})
                </h2>
                <span className="text-xs text-zinc-500">
                  {activeDocId ? '1 Active for Copilot' : 'No Active Resume Selected'}
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#12141c]/40 p-8 text-center text-xs text-zinc-500">
                  No resumes uploaded yet. Upload a PDF or DOCX file to see extracted context here.
                </div>
              ) : (
                documents.map((doc) => {
                  const isActive = doc.id === activeDocId;
                  const isExpanded = doc.id === expandedPreviewId;

                  return (
                    <div
                      key={doc.id}
                      className={`rounded-2xl border transition-all ${
                        isActive
                          ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/10 to-[#12141c]'
                          : 'border-white/10 bg-[#12141c]'
                      }`}
                    >
                      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                              isActive
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-white/5 border-white/10 text-zinc-400'
                            }`}
                          >
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white">{doc.name}</h4>
                              {isActive && (
                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                  Active Context
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                              <span className="uppercase text-[11px] font-semibold text-zinc-500">
                                {doc.fileType}
                              </span>
                              <span>•</span>
                              <span>{doc.wordCount?.toLocaleString() || 0} words</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-zinc-500" />
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => setExpandedPreviewId(isExpanded ? null : doc.id)}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.07] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{isExpanded ? 'Hide Text' : 'Inspect Text'}</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          {!isActive && (
                            <button
                              onClick={() => setActiveDocId(doc.id)}
                              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                            >
                              Set as Active
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Resume Identity Extraction Card */}
                      {doc.identity && (doc.identity.name || doc.identity.email || doc.identity.experienceYears !== null) && (
                        <div className="mx-5 mb-4 p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex flex-wrap items-center gap-4 text-xs">
                          {doc.identity.name && (
                            <div className="flex items-center gap-1.5 text-zinc-200">
                              <User className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="font-semibold">{doc.identity.name}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">({doc.identity.source})</span>
                            </div>
                          )}
                          {doc.identity.email && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Mail className="h-3.5 w-3.5 text-blue-400" />
                              <span className="font-mono text-[11px]">{doc.identity.email}</span>
                            </div>
                          )}
                          {doc.identity.phone && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Phone className="h-3.5 w-3.5 text-amber-400" />
                              <span className="font-mono text-[11px]">{doc.identity.phone}</span>
                            </div>
                          )}
                          {doc.identity.linkedin && (
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Linkedin className="h-3.5 w-3.5 text-sky-400" />
                              <span className="font-mono text-[11px] truncate max-w-[150px]">{doc.identity.linkedin}</span>
                            </div>
                          )}
                          {doc.identity.experienceYears !== null && (
                            <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg text-[11px]">
                              <Briefcase className="h-3 w-3 text-emerald-400" />
                              <span>{doc.identity.experienceSummary}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expandable Extracted Text Preview */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                              Extracted Raw Plain Text (Prompt Context)
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {doc.charCount?.toLocaleString() || 0} characters
                            </span>
                          </div>
                          <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed select-text">
                            {doc.extractedText || 'No text extracted from this file.'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Prompt Directives & Custom Instructions Manager (1 Col) */}
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 shadow-xl">
              <div className="flex items-center gap-2 text-white font-semibold mb-2">
                <Settings className="h-5 w-5 text-emerald-400" />
                <h3>Prompt Calibration</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                Direct how Groq Llama 3.3 formats your answers during live technical interviews and coding calls.
              </p>

              <form onSubmit={handleSaveDirectives} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Target Role Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Staff Distributed Systems Engineer"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Target Company
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe, Meta, Amazon"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Custom Instructions & Style
                  </label>
                  <textarea
                    rows={6}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Answer with concise bullet points in STAR format. Always discuss time/space complexity tradeoffs."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-black transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{savedSettings ? 'Saved to Active Profile!' : 'Save Directives'}</span>
                </button>
              </form>
            </div>

            {/* Desktop Sync Info Card */}
            <div className="rounded-3xl border border-white/10 bg-[#12141c]/60 p-6 flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Desktop HUD Live Sync
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                When you click <strong>Launch Desktop App</strong>, your active resume text and custom instructions are automatically synced to the desktop copilot HUD prompt engine via <code>/api/vault/active</code>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
