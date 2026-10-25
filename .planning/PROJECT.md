# GhostPilot - Real-Time AI Interview & Call Copilot

## What This Is

GhostPilot is a production-grade, real-time AI Interview & Call Copilot platform engineered to provide instant, sub-second answers, coding solutions, and speech transcription during live technical interviews and high-stakes calls. The system operates as a synchronized Turborepo monorepo comprising a Next.js 15 web platform (dashboard, resume vault, question bank, Razorpay credit billing) and an Electron desktop stealth HUD overlay that remains completely invisible to screen shares (Zoom, Google Meet, Teams), immune to browser tab-switch and blur detection, and captures loopback system audio without recording banners.

## Core Value

Deliver an undetectable, sub-second latency real-time copilot HUD that captures both caller loopback audio and candidate microphone input, transcribes and diarizes live speech via Deepgram Nova-2, and streams context-aware answers and vision-based coding solutions from Claude without forfeiting OS focus or appearing in screen captures.

## Business Context

- **Customer**: Software engineering candidates, technical interviewees, sales executives, and corporate professionals navigating virtual interviews and critical client calls.
- **Revenue model**: Credit-based usage and recurring subscription tiers billed through Razorpay for interview minutes, AI coding vision requests, and mock interview practice.
- **Success metric**: Sub-800ms end-to-end question detection to answer streaming latency, 100% exclusion from OS screen-sharing APIs, zero focus loss / blur events on proctored coding assessment platforms.
- **Strategy notes**: GhostPilot desktop companion pairs with the web dashboard via seamless deep-link token handoff (`parakeet://auth?token=...`).

## Current State

- **Shipped Version:** v1.0 (2026-10-25)
- **Status:** All 6 phases completed (18/18 plans). 100% test coverage across core audio and AI engines. Neutral desktop installer (`SystemAudioHelper.exe`) built with Electron fuse hardening.
- **Repository:** https://github.com/Saksham842/helper.git

## Requirements

### Validated in v1.0

- [x] **MONO-01**: Turborepo monorepo setup (`apps/web`, `apps/desktop`, `packages/shared`) with pnpm workspaces and strict TypeScript.
- [x] **STLTH-01**: Electron stealth HUD overlay with screen-capture invisibility via `setContentProtection(true)` (Windows `WDA_EXCLUDEFROMCAPTURE` and macOS `NSWindowSharingNone`).
- [x] **STLTH-02**: Focus-neutral operation with `focusable: false`, `alwaysOnTop: true`, and click-through mode (`setIgnoreMouseEvents(true, { forward: true })`).
- [x] **STLTH-03**: OS-level concealment: `skipTaskbar: true`, transparent frameless window, neutral process naming (`SystemAudioHelper`).
- [x] **STLTH-04**: Global keyboard shortcut overlay navigation via Electron `globalShortcut`.
- [x] **AUDIO-01**: Native dual-channel audio capture combining OS system loopback audio and microphone input without browser sharing banners.
- [x] **AUDIO-02**: Free local offline Whisper STT engine via `@huggingface/transformers` (`whisper-base.en` ONNX) with VAD diarization.
- [x] **AI-01**: Automatic interviewer question detection heuristics and manual hotkey trigger initiating streaming Claude AI responses.
- [x] **AI-02**: Context-injected answer generation incorporating candidate resume text, target job description, and custom instructions.
- [x] **AI-03**: Silent full-screen capture via `desktopCapturer.getSources({ types: ['screen'] })` without OS screenshot UI.
- [x] **AI-04**: Claude Vision integration analyzing coding screenshots to solve DSA and system design challenges with step-by-step code and complexity analysis.
- [x] **WEB-01**: Next.js 15 App Router web dashboard with modern dark/light UI, Google OAuth and Email auth via Supabase Auth.
- [x] **WEB-02**: Document & Resume Vault supporting PDF and DOCX uploads with automated server-side text extraction.
- [x] **WEB-03**: Desktop app deep-linking (`copilot://auth?token=...`) for authentication token handoff.
- [x] **WEB-04**: Interactive Voice AI Mock Interviewer simulating realistic interview scenarios with live speech evaluation and transcripts.
- [x] **WEB-05**: Post-call AI session intelligence: automated meeting summaries, action items, transcript archives, and question bank indexing.
- [x] **QUAL-01**: Zero TypeScript errors (`noImplicitAny`), Zod runtime schema validation, Vitest unit test suite, and Playwright E2E smoke tests.
- [x] **STLTH-05**: Production packaging (`SystemAudioHelper.exe` NSIS installer) with Electron fuses (`RunAsNode=false`, `OnlyLoadAppFromAsar=true`).

### Future Milestone Goals (v2.0)

- **V2-01**: Eye-contact simulation / gaze correction integration for video calls.
- **V2-02**: Native Linux stealth overlay support using Wayland/X11 compositing overrides.
- **V2-03**: Multi-language real-time translation for foreign language interviews.

### Out of Scope

- **Kernel-level rootkits / memory injection**: Unnecessary and dangerous; standard OS window protection (`SetWindowDisplayAffinity` / `NSWindowSharingNone`) and loopback audio capture cleanly fulfill stealth requirements without tripping antivirus heuristics or corrupting OS stability.
- **Browser extension-only implementation**: Standard browser extensions cannot bypass `visibilitychange` or `blur` events, cannot capture desktop loopback audio without UI banners, and cannot evade window-level screen capture.
- **Mobile companion app (v1)**: Focus dedicated to desktop Windows & macOS operating systems where technical interviews and live coding assessments take place.

## Context

- **Platform Target**: Windows 10/11 (WASAPI loopback audio, `WDA_EXCLUDEFROMCAPTURE`) and macOS 13+ (CoreAudio / ScreenCaptureKit audio, `NSWindowSharingNone`).
- **Target Applications**: Zoom, Google Meet, Microsoft Teams, Webex, HackerRank, LeetCode, CoderPad, CodeSignal.
- **Audio Architecture**: PCM audio buffer resampling to 16kHz mono linear16 streamed directly via WebSocket to Deepgram Nova-2 speech-to-text API.
- **AI Architecture**: Anthropic Claude 3.5 Sonnet / Haiku streaming completions with prompt chaining for interview questions and vision analysis for code screenshots.

## Constraints

- **Tech Stack**: Turborepo, pnpm, Next.js 15 (React 19), Electron 33+, Vite 6, Supabase, Tailwind CSS, TypeScript.
- **Security & Privacy**: User resume and session data protected with Supabase Row Level Security (RLS); local desktop capture data processed in-memory and never cached unencrypted to disk.
- **Performance**: HUD render overhead must remain minimal (<2% CPU usage idle) to avoid system lag during heavy coding evaluations or video calls.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Turborepo Monorepo | Enables shared TypeScript types and synchronized builds between web dashboard and desktop overlay | ⏳ Pending |
| Electron + Vite for HUD | Native OS access required for `setContentProtection`, global shortcuts, loopback audio, and `desktopCapturer` | ⏳ Pending |
| Supabase (Auth, Postgres, Realtime, Storage) | Unified backend with instant auth, postgres schema, RLS, and realtime session synchronization | ⏳ Pending |
| Deepgram Nova-2 WebSocket | Industry-leading lowest latency speech-to-text with native diarization for real-time interview flows | ⏳ Pending |
| Razorpay Billing | Robust credit package checkout with webhook verification and balance management | ⏳ Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-24 after initialization*
