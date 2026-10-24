# Parakeet AI - Real-Time AI Interview & Call Copilot

## What This Is

Parakeet AI is a production-grade, real-time AI Interview & Call Copilot platform engineered to provide instant, sub-second answers, coding solutions, and speech transcription during live technical interviews and high-stakes calls. The system operates as a synchronized Turborepo monorepo comprising a Next.js 15 web platform (dashboard, resume vault, question bank, Razorpay credit billing) and an Electron desktop stealth HUD overlay that remains completely invisible to screen shares (Zoom, Google Meet, Teams), immune to browser tab-switch and blur detection, and captures loopback system audio without recording banners.

## Core Value

Deliver an undetectable, sub-second latency real-time copilot HUD that captures both caller loopback audio and candidate microphone input, transcribes and diarizes live speech via Deepgram Nova-2, and streams context-aware answers and vision-based coding solutions from Claude without forfeiting OS focus or appearing in screen captures.

## Business Context

- **Customer**: Software engineering candidates, technical interviewees, sales executives, and corporate professionals navigating virtual interviews and critical client calls.
- **Revenue model**: Credit-based usage and recurring subscription tiers billed through Razorpay for interview minutes, AI coding vision requests, and mock interview practice.
- **Success metric**: Sub-800ms end-to-end question detection to answer streaming latency, 100% exclusion from OS screen-sharing APIs, zero focus loss / blur events on proctored coding assessment platforms.
- **Strategy notes**: Parakeet AI desktop companion pairs with the web dashboard via seamless deep-link token handoff (`parakeet://auth?token=...`).

## Requirements

### Validated

(None yet — greenfield initialization; ship phases to validate)

### Active

- [ ] **MONO-01**: Turborepo monorepo setup (`apps/web`, `apps/desktop`, `packages/types`, `packages/config`) with pnpm workspaces and strict TypeScript.
- [ ] **STLTH-01**: Electron stealth HUD overlay with screen-capture invisibility via `setContentProtection(true)` (Windows `WDA_EXCLUDEFROMCAPTURE` and macOS `NSWindowSharingNone`).
- [ ] **STLTH-02**: Focus-neutral operation with `focusable: false`, `alwaysOnTop: true`, and click-through mode (`setIgnoreMouseEvents(true, { forward: true })`) preventing browser `blur` and `visibilitychange` events.
- [ ] **STLTH-03**: OS-level concealment: `skipTaskbar: true`, transparent frameless window, macOS dock hiding (`LSUIElement: true`), and neutral process metadata (`SystemAudioHelper`).
- [ ] **STLTH-04**: 100% global hotkey navigation via Electron `globalShortcut` for toggling visibility, click-through, screenshot triggers, and manual question prompts.
- [ ] **AUDIO-01**: Native dual-channel audio capture combining OS system loopback audio (caller voice) and microphone input without browser sharing banners.
- [ ] **AUDIO-02**: Real-time dual-channel audio streaming over WebSocket to Deepgram Nova-2 with speaker diarization (Interviewer vs Candidate).
- [ ] **AI-01**: Automatic interviewer question detection heuristics and manual hotkey trigger initiating streaming Claude AI responses.
- [ ] **AI-02**: Context-injected answer generation incorporating candidate resume text, target job description, and custom instructions (up to 20k characters).
- [ ] **AI-03**: Silent full-screen capture via `desktopCapturer.getSources({ types: ['screen'] })` sent to Claude Vision for real-time coding problem solving (DSA, LeetCode, HackerRank, system design) with code, explanation, and time/space complexity.
- [ ] **WEB-01**: Next.js 15 App Router web dashboard with modern dark/light aesthetic, Google OAuth and Email authentication via Supabase Auth.
- [ ] **WEB-02**: Document and Resume Vault supporting PDF and DOCX uploads with automated server-side text extraction.
- [ ] **WEB-03**: Seamless desktop app deep-linking (`parakeet://auth?token=...`) for authentication token handoff.
- [ ] **WEB-04**: Interactive Voice AI Mock Interviewer simulating realistic interview scenarios with live speech evaluation and transcripts.
- [ ] **WEB-05**: Post-call AI session intelligence: automated meeting summaries, action items, transcript archives, and question bank indexing.
- [ ] **BILL-01**: Razorpay payment gateway integration for credit package purchases and webhook transaction verification.
- [ ] **QUAL-01**: Zero TypeScript errors (`noImplicitAny`), Zod runtime environment schema validation, Vitest unit/integration test suite, and Playwright E2E tests for Web and Desktop.

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
