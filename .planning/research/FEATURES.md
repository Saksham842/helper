# Features Research: GhostPilot Platform

**Domain:** Real-Time AI Interview Assistant & Call Copilot
**Researched:** 2026-10-24
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Description | Complexity | Priority |
|---------|-------------|------------|----------|
| Live Speech Transcription | Real-time conversion of spoken words to text with sub-500ms delay. | Medium | P0 |
| Speaker Diarization | Distinguishing between interviewer and candidate speech channels. | Medium | P0 |
| Real-Time AI Answers | Bullet points and key talking points generated while the interviewer speaks. | Medium | P0 |
| Screen-Share Invisibility | Exclusion from Zoom, Google Meet, Teams, and Webex screen captures. | High | P0 |
| Anti-Detection Focus Neutrality | HUD operation that never triggers `window.blur` or `visibilitychange` events in browser assessments. | High | P0 |
| Silent Screen Vision Solver | Instant capture of screen content (coding problem, system design diagram) with code solutions. | Medium | P0 |
| Web Dashboard | User account management, credit balance, and session configuration. | Low | P0 |
| Resume & Document Vault | Upload resume (PDF/DOCX) so AI references real candidate experience. | Medium | P0 |
| Credit & Billing System | Pay-as-you-go or subscription tiers via Razorpay. | Medium | P0 |

### Differentiators (Competitive Advantage)

| Feature | Description | Value Proposition |
|---------|-------------|-------------------|
| Banner-Free Loopback Capture | Direct OS loopback capture eliminates Chrome's visible "Sharing this tab/screen" recording banner. | High trust and safety. |
| Click-Through Transparent HUD | HUD sits over IDE/browser; candidate can click through directly into editor while reading suggestions. | Completely natural flow. |
| Automatic Question Detection | Natural language heuristics identify when interviewer finished asking a question. | Zero latency manual lag. |
| Dual-Channel Audio Pipeline | Independent audio streams prevent candidate's microphone from bleeding into interviewer speech analysis. | Cleanest transcription. |
| Mock Interview Practice Mode | Voice AI interviewer conducts realistic simulated mock interviews and provides actionable feedback. | Comprehensive candidate readiness. |
| Post-Call Meeting Intelligence | Instant summary, action items, verbatim transcript, and question bank cataloging. | Continuous interview learning. |

### Anti-Features (Deliberately Avoid)

| Anti-Feature | Why Avoid | Alternative |
|--------------|-----------|-------------|
| Kernel Rootkits / Memory Injection | Triggers antivirus engines (Windows Defender, CrowdStrike), violates OS security integrity. | Native Win32 `SetWindowDisplayAffinity` and macOS `NSWindowSharingNone` APIs. |
| Browser-Only Architecture | Enforces mandatory tab-share banners and triggers blur/visibility events on proctored sites. | Native Electron desktop HUD companion. |
| Hardcoded Credentials | Security vulnerability; exposes API keys in client builds. | Supabase RLS and server-side API proxy routes. |
