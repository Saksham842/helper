<!-- GSD:project-start source:PROJECT.md -->

## Project

**GhostPilot - Real-Time AI Interview & Call Copilot (100% Free & Open)**

GhostPilot is a production-grade, 100% free, real-time AI Interview & Call Copilot platform engineered to provide instant, sub-second answers, coding solutions, and speech transcription during live technical interviews and high-stakes calls. The system operates as a synchronized Turborepo monorepo comprising a Next.js 15 web platform (dashboard, resume vault, question bank, voice AI mock interviewer) and an Electron desktop stealth HUD overlay (`SystemAudioHelper`) that remains completely invisible to screen shares (Zoom, Google Meet, Teams), immune to browser tab-switch and blur detection, and captures loopback system audio without recording banners.

**Core Value:** Deliver an undetectable, sub-second latency real-time copilot HUD that captures both caller loopback audio and candidate microphone input, transcribes live speech locally/offline via quantized Whisper (`@huggingface/transformers`), and streams context-aware answers and vision-based coding solutions from Groq (`llama-3.3-70b-versatile`, `llama-3.2-11b-vision-preview`) without forfeiting OS focus or appearing in screen captures.

### Constraints

- **Tech Stack**: Turborepo, pnpm, Next.js 15 (React 19), Electron 33+, Vite 6, Supabase, Tailwind CSS, TypeScript.
- **Pricing & Access**: 100% free and unlimited. No payment gateways, no Razorpay, no credit tokens or subscription barriers.
- **Security & Privacy**: User resume and session data protected with Supabase Row Level Security (RLS); local desktop capture data processed in-memory and never cached unencrypted to disk.
- **Performance**: HUD render overhead must remain minimal (<2% CPU usage idle) to avoid system lag during heavy coding evaluations or video calls.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
