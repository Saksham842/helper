# Requirements: Parakeet AI Platform

**Defined:** 2026-10-24
**Core Value:** Deliver an undetectable, sub-second latency real-time copilot HUD that captures both caller loopback audio and candidate microphone input, transcribes and diarizes live speech via Deepgram Nova-2, and streams context-aware answers and vision-based coding solutions from Claude without forfeiting OS focus or appearing in screen captures.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Architecture & Monorepo

- [x] **MONO-01**: Setup Turborepo monorepo with pnpm workspaces supporting `apps/web`, `apps/desktop`, `packages/shared-types`, and `packages/config`.
- [x] **MONO-02**: Establish strict TypeScript configurations (`noImplicitAny`), shared types, and unified build pipelines across all workspace packages.

### Stealth Desktop Overlay

- [ ] **STLTH-01**: Electron overlay implements `win.setContentProtection(true)` to guarantee 100% invisibility to screen share software (Zoom, Google Meet, Teams) via Win32 `WDA_EXCLUDEFROMCAPTURE` and macOS `NSWindowSharingNone`.
- [ ] **STLTH-02**: Overlay window is initialized with `focusable: false`, `alwaysOnTop: true` (`level: 'screen-saver'`), and click-through mode (`setIgnoreMouseEvents(true, { forward: true })`) to prevent OS focus loss and browser `blur` or `visibilitychange` events.
- [ ] **STLTH-03**: Desktop client features OS stealth flags: `skipTaskbar: true` on Windows, frameless transparent glass styling, and `app.dock.hide()` / `LSUIElement: true` on macOS.
- [ ] **STLTH-04**: 100% keyboard-driven overlay navigation via Electron `globalShortcut` for toggling visibility, opacity, click-through, and prompt actions.
- [ ] **STLTH-05**: Neutral executable and process metadata (`SystemAudioHelper` / `DisplayAudioService`) configured in `electron-builder.yml`.

### Native Dual-Channel Audio Pipeline

- [ ] **AUDIO-01**: Native loopback audio capture (WASAPI Loopback on Windows / ScreenCaptureKit or CoreAudio on macOS) grabs caller/interviewer voice without browser tab-sharing banners.
- [ ] **AUDIO-02**: Microphone capture grabs candidate speech independently on a separate audio stream.
- [ ] **AUDIO-03**: Dual-channel linear16 PCM audio streamed via WebSocket to Deepgram Nova-2 with real-time speaker diarization (Interviewer vs Candidate) and auto-reconnect logic.

### AI Answer & Coding Engine

- [ ] **AI-01**: Automatic question detection heuristics trigger AI answers when the interviewer stops speaking, complemented by a manual instant hotkey prompt.
- [ ] **AI-02**: Streaming answer generation powered by Claude 3.5 Sonnet / Haiku with full candidate resume context, target role description, and custom instructions (up to 20k characters).
- [ ] **AI-03**: Silent full-screen capture triggered via global shortcut (`Ctrl/Cmd + Shift + H`) using `desktopCapturer.getSources({ types: ['screen'] })` without OS screenshot UI or clipboard alteration.
- [ ] **AI-04**: Claude 3.5 Vision integration analyzes coding screenshots to solve DSA, LeetCode, HackerRank, and system design challenges with step-by-step code, explanation, and time/space complexity.

### Web Platform & Backend

- [x] **WEB-01**: Next.js 15 App Router web dashboard with modern dark/light UI, Google OAuth, and Email authentication via Supabase Auth.
- [ ] **WEB-02**: Document & Resume Vault supporting PDF and DOCX uploads with server-side text extraction and secure Supabase Storage.
- [x] **WEB-03**: Deep-link token handoff protocol (`parakeet://auth?token=...`) securely syncing web session credentials to the desktop client.
- [ ] **WEB-04**: Interactive Voice AI Mock Interviewer simulating realistic interview rounds with speech interaction and automated transcript evaluation.
- [ ] **WEB-05**: Post-call meeting analytics with automated AI summaries, action items, verbatim transcript history, and searchable question bank.

### Billing & Credits

- [ ] **BILL-01**: Razorpay checkout integration for purchasing credit packs (interview minutes, AI vision tokens).
- [ ] **BILL-02**: Razorpay webhook verification and automated credit balance management stored in Supabase PostgreSQL with RLS.

### Quality, Security & Testing

- [x] **QUAL-01**: Zero TypeScript compiler errors (`tsc --noEmit`), strict ESLint rules, and Zod runtime schema validation for environment variables and API contracts.
- [ ] **QUAL-02**: Vitest unit and integration test suites covering audio processing, AI prompt construction, and billing webhooks.
- [ ] **QUAL-03**: Playwright automated E2E test suites validating web dashboard workflows and Electron HUD invisibility/focus neutrality.

## v2 Requirements

### Advanced Capabilities (Deferred)

- **V2-01**: Eye-contact simulation / gaze correction integration for video calls.
- **V2-02**: Native Linux stealth overlay support using Wayland/X11 compositing overrides.
- **V2-03**: Multi-language real-time translation for foreign language interviews.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Kernel Rootkits / Memory Injection | Triggers antivirus (CrowdStrike, Windows Defender) and breaks OS code-signing; standard OS APIs (`SetWindowDisplayAffinity`) handle invisibility safely and cleanly. |
| Browser Extension Only | Browser sandboxes enforce tab-recording banners and trigger `blur` / `visibilitychange` events on proctored coding assessment platforms. |
| Mobile Companion App (v1) | Desktop environments (Windows/macOS) are the primary platform for video interviews and live technical coding assessments. |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MONO-01 | Phase 1 | Complete |
| MONO-02 | Phase 1 | Complete |
| WEB-01 | Phase 1 | Complete |
| WEB-03 | Phase 1 | Complete |
| QUAL-01 | Phase 1 | Complete |
| STLTH-01 | Phase 2 | Pending |
| STLTH-02 | Phase 2 | Pending |
| STLTH-03 | Phase 2 | Pending |
| STLTH-04 | Phase 2 | Pending |
| AUDIO-01 | Phase 3 | Pending |
| AUDIO-02 | Phase 3 | Pending |
| AUDIO-03 | Phase 3 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 4 | Pending |
| BILL-01 | Phase 5 | Pending |
| BILL-02 | Phase 5 | Pending |
| WEB-02 | Phase 5 | Pending |
| WEB-04 | Phase 5 | Pending |
| WEB-05 | Phase 5 | Pending |
| STLTH-05 | Phase 6 | Pending |
| QUAL-02 | Phase 6 | Pending |
| QUAL-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✅

---
*Requirements defined: 2026-10-24*
*Last updated: 2026-10-24 after initial definition*
