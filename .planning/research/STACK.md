# Stack Research: GhostPilot Platform

**Domain:** Real-Time AI Copilot & Stealth Desktop Overlay (100% Free & Open)
**Researched:** 2026-10-24
**Updated:** 2026-10-25
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Turborepo | ^2.3 | Monorepo Orchestration | High-speed cached builds and type synchronization across `apps/web` and `apps/desktop`. |
| Next.js | 15.x | Web Dashboard & Vault | Modern App Router, React 19 Server Components, optimized SEO and API routes for Supabase. |
| Electron | 33.x | Stealth Desktop Overlay | Cross-platform desktop runtime exposing Win32 `SetWindowDisplayAffinity` and macOS `NSWindowSharingNone`. |
| Vite | 6.x | Desktop App Bundler | Lightning-fast HMR and ESM build pipeline for Electron renderer process. |
| React | 19.x | UI Library | Unified UI framework across web and desktop renderer. |
| TypeScript | ^5.6 | Strict Type Safety | Complete end-to-end type contracts across shared packages and API communication. |
| Tailwind CSS | 4.x / 3.4 | Styling | Modern, responsive, utility-first styling with dark/light theming. |
| Supabase | Latest | Auth, DB, Realtime, Storage | PostgreSQL with RLS, OAuth authentication, storage for resumes, and Realtime WebSocket channel. |

### Supporting Libraries & SDKs

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `groq-sdk` | ^0.15 | AI Reasoning & Vision | Ultra-low-latency streaming answers (`llama-3.3-70b-versatile`) and silent screenshot coding problem solving (`llama-3.2-11b-vision-preview`). |
| `@huggingface/transformers` | ^3.3 | Local Speech-to-Text | Zero-cost, 100% offline quantized Whisper transcription in browser & Electron renderer with ONNX Runtime WASM. |
| `unpdf` | ^0.12 | PDF Text Extraction | Bundled pdfjs parser without external Webpack conflicts for Next.js App Router; binary regex fallback. |
| `mammoth` | Latest | Document Text Extraction | Parsing uploaded DOCX resumes into clean plain text for prompt context. |
| `zod` | ^3.23 | Schema Validation | Validating environment variables (`GROQ_API_KEY`), API payloads, and IPC messages. |
| `lucide-react` | Latest | Icons | Consistent, lightweight iconography across web and desktop UI. |

### Audio & Stealth Capture Native Tools

| Tool / API | Platform | Purpose | Notes |
|------------|----------|---------|-------|
| `setContentProtection(true)` | Windows / macOS | Screen share invisibility | Sets `WDA_EXCLUDEFROMCAPTURE` on Windows and `NSWindowSharingType.none` on macOS. |
| `desktopCapturer` | Windows / macOS | Silent screenshot capture | Background window/screen image grabbing without invoking OS screenshot UI. |
| WASAPI / CoreAudio Loopback | Windows / macOS | Loopback audio capture | Captures system audio loopback alongside microphone without browser sharing banners. |
| `globalShortcut` | Electron | Keyboard-driven control | Handles toggle commands without shifting OS focus away from coding/interview browsers. |

### Testing & Quality Assurance

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit & Integration testing | Fast, modern test runner for shared packages and backend utilities. |
| Playwright | E2E testing | Cross-browser tests for Next.js web dashboard and Electron application. |
| ESLint & Prettier | Linting & Formatting | Strict linting rules with zero warnings allowed. |
