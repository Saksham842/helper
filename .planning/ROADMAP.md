# Roadmap: GhostPilot Platform

## Overview

A phased journey to build a complete, production-grade GhostPilot clone in a Turborepo monorepo. The roadmap follows an end-to-end vertical MVP architecture starting with the monorepo foundation, Supabase database schema, web authentication, and desktop deep-linking protocol handoff, progressing through the native stealth Electron HUD, loopback audio pipeline with Deepgram Nova-2, Claude AI answer and vision problem solving, Razorpay billing, and production hardening with automated test suites.

## Phases

- [x] **Phase 1: Monorepo Scaffold, Database Schema, Auth & Desktop Deep-Linking** - Setup Turborepo (`apps/web`, `apps/desktop`, `packages/shared`), Supabase migrations with RLS (`profiles`, `sessions`, `documents`, `transcripts`, `ai_responses`, `credit_transactions`), Google/Email Auth, `copilot://auth` desktop deep-linking, strict Zod env validation, and Playwright smoke test.
- [x] **Phase 2: Stealth Electron HUD Overlay & Screen Protection Core** - Build transparent floating HUD overlay with `setContentProtection(true)` (Windows `WDA_EXCLUDEFROMCAPTURE` & macOS `NSWindowSharingNone`), anti-blur focus neutrality (`focusable: false`, `alwaysOnTop: true`), click-through mode, and OS global hotkeys (`globalShortcut`).
- [x] **Phase 3: Native Dual-Channel Audio Pipeline & Deepgram Nova-2 Streaming** - Capture system loopback audio (WASAPI/CoreAudio) and microphone natively without browser recording banners; stream linear16 PCM to Deepgram Nova-2 with real-time speaker diarization.
- [x] **Phase 4: Real-Time AI Answer Engine & Silent Vision Problem Solver** - Stream sub-second Claude 3.5 answers with resume context and solve coding challenges from silent desktop screenshots (`desktopCapturer`).
- [x] **Phase 5: 100% Free Architecture — Resume Vault, Local Offline Whisper STT & Web Voice AI Interviewer** - Implement resume vault with PDF/DOCX text extraction, replace cloud Deepgram with local offline Whisper STT (`@huggingface/transformers`), remove all Razorpay/billing paywalls for 100% free unlimited access, and build the free Voice AI Mock Interviewer simulator with post-call analytics and question bank.
- [x] **Phase 6: Hardening, Packaging, Stealth Verification & Automated Test Suites** - Neutral executable packaging (`SystemAudioHelper`), strict TypeScript, Vitest unit tests, and Playwright E2E anti-detection validation.
- [ ] **Phase 7: IntervieHire Feature Adoption & Docs Overhaul** - Port resume identity extraction, question bank tagging, speech metrics, waiting room tech check, proctoring fair-play simulation, and self-serve data rights portal from IntervieHire reference, accompanied by an extensive documentation overhaul.

> **Milestone v1.0 Shipped & Archived:** See full historical details in [.planning/milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

## Phase Details

### Phase 1: Monorepo Scaffold, Database Schema, Auth & Desktop Deep-Linking
**Goal**: Establish the Turborepo monorepo foundation, Supabase PostgreSQL schema with RLS, web authentication, custom desktop protocol deep-linking (`copilot://auth`), strict Zod env validation, and login smoke test.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: MONO-01, MONO-02, WEB-01, WEB-03, QUAL-01
**Success Criteria**:
  1. Turborepo monorepo builds cleanly with pnpm across `apps/web` (Next.js 15), `apps/desktop` (Electron + Vite + React), and `packages/shared`.
  2. Supabase SQL migrations create all 6 core tables (`profiles`, `sessions`, `documents`, `transcripts`, `ai_responses`, `credit_transactions`) with strict Row Level Security (RLS) policies.
  3. User can sign up/login with Email/Password and Google OAuth on Next.js 15 App Router web app with strict Zod environment variable validation (`env.ts`).
  4. Clicking "Launch Desktop App" on the dashboard triggers custom protocol `copilot://auth?token=...` which is intercepted by `apps/desktop` to authenticate the Electron client.
  5. Playwright smoke test verifies web login flow in headless browser.
**Plans**: 3 plans

Plans:
- [x] 01-01: Turborepo monorepo scaffold (`apps/web`, `apps/desktop`, `packages/shared`), pnpm workspace configuration, and strict TypeScript/Zod presets.
- [x] 01-02: Supabase database schema migrations with RLS, triggers, typed database client, and Next.js 15 App Router authentication (Google OAuth & Email/Password).
- [x] 01-03: Desktop custom protocol handler `copilot://auth` in Electron, web dashboard launch button with short-lived session token handoff, and Playwright smoke test.

### Phase 2: Stealth Electron HUD Overlay & Screen Protection Core
**Goal**: Deliver an operational, screen-share invisible, anti-blur Electron desktop HUD with global hotkey controls.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: STLTH-01, STLTH-02, STLTH-03, STLTH-04
**Success Criteria**:
  1. Electron HUD window renders transparently with `setContentProtection(true)` and proves 100% invisible to OS screen capture tools (Zoom, Teams, Meet).
  2. User can toggle visibility and click-through via global OS shortcuts without causing browser `window.onblur` or `visibilitychange` events.
  3. OS stealth flags (`skipTaskbar: true`, `LSUIElement: true`) conceal the overlay window from Taskbar and Dock.
**Plans**: 3 plans

Plans:
- [x] 02-01: Electron + Vite + React desktop application with frameless transparent window and OS stealth flags (`skipTaskbar`, `LSUIElement`).
- [x] 02-02: Implementation of `win.setContentProtection(true)`, click-through toggle, and global hotkeys (`globalShortcut`).
- [x] 02-03: HUD floating UI components with minimized footprint and screen capture verification test harness.


### Phase 3: Native Dual-Channel Audio Pipeline & Deepgram Nova-2 Streaming
**Goal**: Capture system loopback audio and microphone streams natively and transcribe speech in real-time with speaker diarization.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03
**Success Criteria**:
  1. System loopback audio captures remote interviewer speech without displaying browser recording banners.
  2. User microphone audio is captured cleanly without feedback or echo.
  3. Dual-channel audio streams over WebSocket to Deepgram Nova-2 with real-time speaker diarization rendered on the HUD in <400ms.
**Plans**: 3 plans

Plans:
- [x] 03-01: Native OS audio loopback capture engine for Windows (WASAPI) and macOS (CoreAudio).
- [x] 03-02: Microphone capture pipeline and dual-channel 16kHz PCM audio buffer multiplexer.
- [x] 03-03: Deepgram Nova-2 WebSocket client with speaker diarization and live transcript streaming to the HUD.

### Phase 4: Real-Time AI Answer Engine & Silent Vision Problem Solver
**Goal**: Stream contextual interview answers and solve on-screen coding challenges via Claude 3.5 Sonnet and Vision.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: AI-01, AI-02, AI-03, AI-04
**Success Criteria**:
  1. Automatic question detection or manual hotkey triggers sub-800ms streaming responses from Claude 3.5 Sonnet.
  2. Candidate resume text, target role context, and custom instructions are dynamically injected into prompts.
  3. Silent screen capture hotkey takes in-memory screenshot via `desktopCapturer` without OS snipping tool UI.
  4. Claude Vision extracts coding problem statement and streams solution code with explanation and complexity analysis.
**Plans**: 3 plans

Plans:
- [x] 04-01: Transcript question detection heuristics and prompt assembly engine with resume context injection.
- [x] 04-02: Claude 3.5 streaming answer pipeline with real-time token rendering on the HUD.
- [x] 04-03: Silent `desktopCapturer` screenshot capture and Claude Vision coding problem solver.

### Phase 5: 100% Free Architecture — Resume Vault, Local Offline Whisper STT & Web Voice AI Interviewer
**Goal**: Implement resume vault with PDF/DOCX text extraction, replace cloud Deepgram with local offline Whisper STT (`@huggingface/transformers`), remove all Razorpay/billing paywalls for 100% free unlimited access, and build the free Voice AI Mock Interviewer simulator with post-call analytics and question bank.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: WEB-02, STT-FREE, BILL-FREE, WEB-04, WEB-05
**Success Criteria**:
  1. Candidate can upload PDF/DOCX resumes with automated server-side text extraction into Supabase Storage and HUD context injection.
  2. All Razorpay billing dependencies and credit gating are completely removed; all sessions and AI copilot calls are 100% free and unlimited.
  3. Desktop HUD transcription runs 100% locally and offline via `@huggingface/transformers` (quantized Whisper ONNX) with dual-channel VAD diarization without any Deepgram API key.
  4. Candidate can conduct interactive voice AI mock interview sessions in `apps/web` using the browser's free native Web Speech API (`SpeechRecognition` & `speechSynthesis`).
  5. Post-call meeting analytics generate executive summaries, question-by-question critiques, and a personal question bank.
**Plans**: 3 plans

Plans:
- [x] 05-01: Resume Vault upload with PDF/DOCX text extraction and session custom instructions manager.
- [x] 05-02: Replace Deepgram with local offline Whisper STT (`@huggingface/transformers`) and remove Razorpay/credit gating.
- [x] 05-03: Free Voice AI Mock Interviewer simulator (Web Speech API), post-call session notes generator, and question bank.

### Phase 6: Hardening, Packaging, Stealth Verification & Automated Test Suites
**Goal**: Harden the platform with strict type checking, automated tests, anti-detection validation, and production installer packaging.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: STLTH-05, QUAL-02, QUAL-03
**Success Criteria**:
  1. Production packaging compiles with neutral process naming (`SystemAudioHelper`) and generic system icons.
  2. Vitest unit and integration test suites pass with 100% coverage across core audio and AI logic.
  3. Playwright E2E tests verify web dashboard flows and desktop HUD stealth behavior (zero focus loss, zero capture artifacts).
**Plans**: 3 plans

Plans:
- [x] 06-01: REA security & bundle hygiene audit — static analysis of compiled Vite renderer and Electron main bundles for secret key leakage, IPC boundary hygiene, and security flag verification.
- [x] 06-02: Full automated test suite — run all 5 desktop CJS suites, add Vitest unit tests for `apps/web` API logic, extend Playwright E2E tests for new Phase 5 routes, and achieve zero TypeScript/lint errors.
- [x] 06-03: Desktop installer packaging (`electron-builder` NSIS `.exe` + `.dmg`, `SystemAudioHelper` branding, Electron fuse hardening, macOS entitlements) + Vercel deployment config (`vercel.json`, `/api/health`, `.env.example`) + root `README.md`.

### Phase 7: IntervieHire Feature Adoption & Docs Overhaul
**Goal**: Port high-value features from the IntervieHire reference project (resume identity extraction, question bank tagging, speech metrics, waiting room tech check, proctoring fair-play simulation, and self-serve data rights portal) and overhaul all documentation to match the current Groq + unpdf + 100% free architecture.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, DOCS-01
**Success Criteria**:
  1. All project documentation accurately reflects Groq SDK, `unpdf`, local Whisper, and zero-cost architecture with zero stale references.
  2. Uploaded resumes extract candidate contact info, LinkedIn, and experience years via regex and showcase identity badges on the Document Vault.
  3. Pre-interview Waiting Room provides mic/camera checks and room walkthrough before mock sessions start.
  4. Speech metrics compute live WPM, filler word frequency, and delivery style classification.
  5. Proctoring simulator detects tab switches/blur events, and candidates can self-serve export/delete data via the DPDP/GDPR Data Rights portal.
**Plans**: 4 plans

Plans:
- [x] 07-01: Documentation Overhaul Reflecting Current Reality (`GEMINI.md`, `ROADMAP.md`, `STACK.md`, `ARCHITECTURE.md`, `README.md`).
- [x] 07-02: Resume Identity Extraction (`resumeIdentity.ts`, vault badges) & Question Bank Tagging (`questionBank.ts`).
- [x] 07-03: Speech Metrics (`useSpeechMetrics.ts`), AI Tone Heuristics (`heuristics.ts`), and Waiting Room UI (`WaitingRoom.tsx`).
- [x] 07-04: Proctoring Fair-Play Simulator (`useProctoring.ts`) & Self-Serve Data Rights Portal (`/dashboard/data-rights`).

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo Scaffold, Database Schema, Auth & Desktop Deep-Linking | 3/3 | Complete | 2026-10-24 |
| 2. Stealth Electron HUD Overlay & Screen Protection Core | 3/3 | Complete | 2026-10-25 |
| 3. Native Dual-Channel Audio Pipeline & Deepgram Nova-2 Streaming | 3/3 | Complete | 2026-10-25 |
| 4. Real-Time AI Answer Engine & Silent Vision Problem Solver | 3/3 | Complete | 2026-10-25 |
| 5. 100% Free Architecture — Resume Vault & Local Whisper STT | 3/3 | Complete | 2026-10-25 |
| 6. Hardening, Packaging, Stealth Verification & Automated Test Suites | 3/3 | Complete | 2026-10-25 |
| 7. IntervieHire Feature Adoption & Docs Overhaul | 4/4 | Complete | 2026-10-25 |

