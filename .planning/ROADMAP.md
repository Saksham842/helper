# Roadmap: Parakeet AI Platform

## Overview

A phased journey to build a complete, production-grade Parakeet AI clone in a Turborepo monorepo. The roadmap follows a vertical MVP progression starting with the native stealth Electron HUD and loopback audio pipeline, progressing through real-time Claude AI answer and vision streaming, Next.js 15 web platform with Supabase and Razorpay, and culminating in hardened anti-detection verification and automated test suites.

## Phases

- [ ] **Phase 1: Turborepo Monorepo Scaffold & Stealth Electron Overlay Core** - Initialize monorepo, build transparent HUD with screen-share invisibility (`setContentProtection`), anti-blur focus neutrality, and global hotkeys.
- [ ] **Phase 2: Native Dual-Channel Audio Pipeline & Deepgram Nova-2 Streaming** - Capture system loopback audio and microphone natively; stream to Deepgram Nova-2 with real-time speaker diarization.
- [ ] **Phase 3: Real-Time AI Answer Engine & Silent Vision Problem Solver** - Stream sub-second Claude 3.5 answers with resume context and solve coding challenges from silent desktop screenshots.
- [ ] **Phase 4: Next.js 15 Web Platform, Vault & Desktop Deep-Link Handoff** - Deliver web dashboard, Supabase Auth/Postgres, PDF/DOCX resume vault, and deep-link token sync to desktop.
- [ ] **Phase 5: Razorpay Billing, Mock AI Interviewer & Session Intelligence** - Implement Razorpay credit billing, voice AI mock interview simulations, and post-call analytics with question bank.
- [ ] **Phase 6: Hardening, Packaging, Stealth Verification & Automated Test Suites** - Neutral executable packaging (`SystemAudioHelper`), strict TypeScript, Vitest unit tests, and Playwright E2E anti-detection validation.

## Phase Details

### Phase 1: Turborepo Monorepo Scaffold & Stealth Electron Overlay Core
**Goal**: Initialize the Turborepo monorepo and deliver an operational, screen-share invisible, anti-blur Electron desktop HUD with global hotkey controls.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: MONO-01, MONO-02, STLTH-01, STLTH-02, STLTH-03, STLTH-04
**Success Criteria**:
  1. Monorepo builds cleanly with pnpm and Turborepo across `apps/web`, `apps/desktop`, and shared packages.
  2. Electron HUD window renders transparently with `setContentProtection(true)` and proves 100% invisible to OS screen capture tools.
  3. User can toggle visibility and click-through via global OS shortcuts without causing browser `window.onblur` or `visibilitychange` events.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Turborepo monorepo scaffold, pnpm workspaces, and strict TypeScript package configurations.
- [ ] 01-02: Electron + Vite + React desktop application with frameless transparent window and OS stealth flags (`skipTaskbar`, `LSUIElement`).
- [ ] 01-03: Implementation of `win.setContentProtection(true)`, click-through toggle, and global hotkeys (`globalShortcut`).

### Phase 2: Native Dual-Channel Audio Pipeline & Deepgram Nova-2 Streaming
**Goal**: Capture system loopback audio and microphone streams natively and transcribe speech in real-time with speaker diarization.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03
**Success Criteria**:
  1. System loopback audio captures remote interviewer speech without displaying browser recording banners.
  2. User microphone audio is captured cleanly without feedback or echo.
  3. Dual-channel audio streams over WebSocket to Deepgram Nova-2 with real-time speaker diarization rendered on the HUD in <400ms.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Native OS audio loopback capture engine for Windows (WASAPI) and macOS (CoreAudio).
- [ ] 02-02: Microphone capture pipeline and dual-channel 16kHz PCM audio buffer multiplexer.
- [ ] 02-03: Deepgram Nova-2 WebSocket client with speaker diarization and live transcript streaming to the HUD.

### Phase 3: Real-Time AI Answer Engine & Silent Vision Problem Solver
**Goal**: Stream contextual interview answers and solve on-screen coding challenges via Claude 3.5 Sonnet and Vision.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04
**Success Criteria**:
  1. Automatic question detection or manual hotkey triggers sub-800ms streaming responses from Claude 3.5 Sonnet.
  2. Candidate resume text, target role context, and custom instructions are dynamically injected into prompts.
  3. Silent screen capture hotkey takes in-memory screenshot via `desktopCapturer` without OS snipping tool UI.
  4. Claude Vision extracts coding problem statement and streams solution code with explanation and complexity analysis.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Transcript question detection heuristics and prompt assembly engine with resume context injection.
- [ ] 03-02: Claude 3.5 streaming answer pipeline with real-time token rendering on the HUD.
- [ ] 03-03: Silent `desktopCapturer` screenshot capture and Claude Vision coding problem solver.

### Phase 4: Next.js 15 Web Platform, Vault & Desktop Deep-Link Handoff
**Goal**: Deliver the web dashboard for user authentication, resume management, session configuration, and desktop deep-linking.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: WEB-01, WEB-02, WEB-03
**Success Criteria**:
  1. Users can authenticate via Google OAuth and Email with Supabase Auth on Next.js 15 App Router.
  2. Candidate can upload PDF/DOCX resumes with automated text extraction saved into Supabase Storage.
  3. Desktop app deep-link protocol (`parakeet://auth?token=...`) handshakes credentials from web to desktop instantly.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Next.js 15 web platform setup with Supabase Auth, PostgreSQL schema, and RLS policies.
- [ ] 04-02: Resume & Document Vault with PDF/DOCX text parsing and session custom instructions manager.
- [ ] 04-03: Desktop deep-linking protocol registration and secure token handoff flow.

### Phase 5: Razorpay Billing, Mock AI Interviewer & Session Intelligence
**Goal**: Implement credit-based Razorpay monetization, voice AI mock interviews, and post-call analytics.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: BILL-01, BILL-02, WEB-04, WEB-05
**Success Criteria**:
  1. User can purchase credit packs through Razorpay checkout with webhook verification updating balances in real-time.
  2. Candidate can conduct voice AI mock interview sessions with real-time speech responses and scoring feedback.
  3. Post-call analytics generate automated meeting summaries, action items, verbatim transcript history, and question bank indexing.
**Plans**: 3 plans

Plans:
- [ ] 05-01: Razorpay checkout integration, order creation, and signed webhook balance verification.
- [ ] 05-02: Voice AI Mock Interviewer simulator with real-time feedback and score card generation.
- [ ] 05-03: Post-call session notes generator, transcript vault, and community question bank indexing.

### Phase 6: Hardening, Packaging, Stealth Verification & Automated Test Suites
**Goal**: Harden the platform with strict type checking, automated tests, anti-detection validation, and production installer packaging.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: STLTH-05, QUAL-01, QUAL-02, QUAL-03
**Success Criteria**:
  1. Production packaging compiles with neutral process naming (`SystemAudioHelper`) and generic system icons.
  2. Vitest unit and integration test suites pass with 100% coverage across core audio and AI logic.
  3. Playwright E2E tests verify web dashboard flows and desktop HUD stealth behavior (zero focus loss, zero capture artifacts).
**Plans**: 3 plans

Plans:
- [ ] 06-01: Electron Builder production packaging configuration with neutral process branding.
- [ ] 06-02: Vitest unit test suites for audio mixing, Deepgram protocol, and Razorpay webhook validation.
- [ ] 06-03: Playwright E2E test suites and anti-detection automated validation harness.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Turborepo Monorepo Scaffold & Stealth Electron Overlay Core | 0/3 | Not started | - |
| 2. Native Dual-Channel Audio Pipeline & Deepgram Nova-2 Streaming | 0/3 | Not started | - |
| 3. Real-Time AI Answer Engine & Silent Vision Problem Solver | 0/3 | Not started | - |
| 4. Next.js 15 Web Platform, Vault & Desktop Deep-Link Handoff | 0/3 | Not started | - |
| 5. Razorpay Billing, Mock AI Interviewer & Session Intelligence | 0/3 | Not started | - |
| 6. Hardening, Packaging, Stealth Verification & Automated Test Suites | 0/3 | Not started | - |
