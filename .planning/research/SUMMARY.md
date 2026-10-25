# Project Research Summary

**Project:** GhostPilot - Real-Time AI Interview & Call Copilot
**Domain:** Stealth Desktop Overlay & Cloud Web Platform
**Synthesized:** 2026-10-24
**Status:** COMPLETE

## Key Findings

### Stack
- **Monorepo**: Turborepo with pnpm workspaces connecting `apps/web` (Next.js 15, React 19, Tailwind CSS) and `apps/desktop` (Electron 33, Vite 6, React 19).
- **Stealth Architecture**: Native OS window affinity flags (`WDA_EXCLUDEFROMCAPTURE` on Windows, `NSWindowSharingNone` on macOS) accessed via Electron `setContentProtection(true)`.
- **Audio Pipeline**: Dual-channel loopback (WASAPI / CoreAudio) and microphone capture streaming to Deepgram Nova-2 with speaker diarization.
- **AI Engine**: Streaming Claude 3.5 Sonnet / Haiku completions for real-time answers and Claude Vision for coding problem screenshots.
- **Backend & Billing**: Supabase (Auth, Postgres, Realtime, Storage) and Razorpay credit gateway.

### Table Stakes
- Complete screen-share invisibility against Zoom, Google Meet, Microsoft Teams, Webex.
- Anti-detection focus neutrality (`focusable: false`, `alwaysOnTop: true`, click-through mode, global shortcuts) preventing `blur` and `visibilitychange` events.
- Real-time dual-channel audio capture without browser sharing banners.
- Silent screen capture (`desktopCapturer`) to solve coding questions (DSA, LeetCode, HackerRank).
- Web portal with resume vault (PDF/DOCX extraction), mock interviews, and credit billing.

### Watch Out For
- Never use `win.focus()` or `win.show()` during an active session; always use `win.showInactive()`.
- Avoid browser-only architecture because Chrome sandboxes mandate recording bars and fire visibility events.
- Never use kernel rootkits or memory modification techniques which break code signing and trigger antivirus warnings.
- Package desktop executable with neutral naming (`SystemAudioHelper`) in `electron-builder.yml`.

## Implications for Roadmap

1. **Phase 1 (Monorepo Scaffold & Stealth Electron Overlay Core)** must establish the Turborepo monorepo, strict TypeScript packages, and the core Electron window with `setContentProtection`, focus neutrality, click-through, and global shortcuts.
2. **Phase 2 (Native Dual-Channel Audio & Deepgram Pipeline)** must implement WASAPI/CoreAudio loopback and microphone capture with WebSocket streaming to Deepgram Nova-2 for real-time diarized transcription.
3. **Phase 3 (Real-Time AI Answer Engine & Silent Vision Solver)** must integrate Claude 3.5 streaming completions with resume context injection and silent screenshot capture via `desktopCapturer` to solve coding challenges.
4. **Phase 4 (Next.js 15 Web Platform & Supabase Backend)** must deliver the customer web portal with Google/Email auth, resume vault with text extraction, deep-link token handoff to the desktop client, and session management.
5. **Phase 5 (Razorpay Billing, Mock AI Interviewer & Transcript Intelligence)** must implement Razorpay credit billing, interactive voice AI mock interview simulations, and post-call transcript analytics.
6. **Phase 6 (Hardening, Packaging, Stealth Verification & Automated Test Suites)** must finalize neutral executable packaging, complete Vitest unit tests, Playwright E2E suites, and automated verification against focus/screen-capture detection.

## Sources

- GhostPilot Production Application (`https://www.ghostpilot.com/`)
- Microsoft Win32 API: `SetWindowDisplayAffinity` (`WDA_EXCLUDEFROMCAPTURE`) Documentation
- Apple macOS Developer Documentation: `NSWindow.sharingType` (`NSWindowSharingNone`)
- Deepgram Nova-2 Real-Time Streaming WebSocket Protocol
- Anthropic Claude 3.5 Sonnet & Vision API Specifications
- Turborepo & Next.js 15 App Router Architecture Guides
