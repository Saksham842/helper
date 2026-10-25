# Architecture Research: GhostPilot Platform

**Domain:** Turborepo Monorepo with Native Stealth Overlay & Cloud Web Platform (100% Free & Open)
**Researched:** 2026-10-24
**Updated:** 2026-10-25
**Confidence:** HIGH

## System Architecture Overview

```mermaid
graph TD
    subgraph User Desktop Client [apps/desktop - Electron + Vite + React]
        HUD[Stealth Overlay Window - SystemAudioHelper]
        AudioLoopback[OS Loopback WASAPI/CoreAudio]
        AudioMic[User Microphone]
        LocalWhisper[Local Offline Whisper STT via transformers.js]
        Shortcuts[Global Shortcuts Handler]
        ScreenCap[Silent DesktopCapturer]
    end

    subgraph Cloud Infrastructure [apps/web & Groq SDK]
        NextApp[Next.js 15 Web Dashboard]
        SupabaseAuth[Supabase Auth & Session Token]
        SupabaseDB[PostgreSQL with RLS]
        SupabaseStorage[Resume & Document Vault - unpdf/mammoth]
        GroqLLM[Groq Cloud API - Llama 3.3 70B Versatile]
        GroqVision[Groq Vision API - Llama 3.2 11B Vision Preview]
    end

    AudioLoopback --> LocalWhisper
    AudioMic --> LocalWhisper
    LocalWhisper -->|Live Transcripts & Diarization| HUD
    HUD -->|Prompt + Resume Context| GroqLLM
    ScreenCap -->|Screenshot Buffer| GroqVision
    GroqLLM -->|Streaming SSE Tokens| HUD
    GroqVision -->|Code & Complexity Analysis| HUD
    Shortcuts -->|Toggle HUD / Silent Capture| HUD
    NextApp -->|copilot://auth Protocol Handoff| HUD
    NextApp --> SupabaseAuth
    NextApp --> SupabaseDB
    NextApp --> SupabaseStorage
```

## Native Stealth HUD Layer

1. **Screen Share Invisibility**:
   - Windows: `mainWindow.setContentProtection(true)` sets `WDA_EXCLUDEFROMCAPTURE` (`0x11`) via Win32 `SetWindowDisplayAffinity`. Video capture software (Zoom, Teams, Meet, OBS) captures the background behind the window.
   - macOS: `mainWindow.setContentProtection(true)` sets `NSWindowSharingType.none` on the underlying `NSWindow`.
2. **Focus Neutrality**:
   - Window configured with `focusable: false`, `alwaysOnTop: true` (`level: 'screen-saver'`), and click-through mode (`setIgnoreMouseEvents(true, { forward: true })`).
   - Browser tabs (HackerRank, CoderPad, LeetCode) retain 100% OS focus; `window.onblur` and `document.onvisibilitychange` never fire.
   - All controls mapped to OS global hotkeys (`globalShortcut`).
3. **OS-Level Camouflage**:
   - `skipTaskbar: true` removes app from Taskbar and Alt-Tab on Windows.
   - `LSUIElement: true` and `app.dock.hide()` on macOS runs app as a background daemon invisible to the Dock and Cmd-Tab.
   - Executable and process named `SystemAudioHelper` in `electron-builder.yml`.

## Audio & Transcription Pipeline

1. **System Loopback Audio**:
   - Captures incoming sound from the caller/interviewer directly from the operating system's audio playback output device (WASAPI loopback on Windows; CoreAudio tap / ScreenCaptureKit on macOS).
2. **Microphone Audio**:
   - Captures candidate's local microphone input.
3. **100% Free Offline / Cloud STT**:
   - Desktop client: `@huggingface/transformers` quantized Whisper ONNX model running in-process via WebAssembly SIMD threads with zero external API fees or cloud dependencies.
   - Web mock interviewer: Native Web Speech API (`SpeechRecognition` & `speechSynthesis`) for zero-latency interactive voice sessions.

## Real-Time AI & Vision Pipeline

1. **Question Detection Engine**:
   - Streamed transcript analyzed with lightweight heuristics (interrogative words, terminal punctuation, pause detection) or manual hotkey trigger.
2. **Streaming AI Context**:
   - Groq SDK (`llama-3.3-70b-versatile`) prompt initialized with candidate resume, job context, custom instructions (up to 20k characters), and recent conversation history.
   - Tokens streamed directly via SSE into the floating HUD with sub-second latency.
3. **Silent Vision Problem Solver**:
   - Global shortcut (e.g., `Cmd/Ctrl + Shift + H` or `Ctrl + Alt + V`) invokes `desktopCapturer.getSources({ types: ['screen'] })`.
   - Silent JPEG snapshot taken in memory without screen flash or OS snipping overlay.
   - Image payload dispatched to Groq Vision API (`llama-3.2-11b-vision-preview`) to extract DSA problem, analyze constraints, and generate solution code and complexity breakdown.

## Monorepo Layout

```
├── apps
│   ├── desktop              # Electron + Vite + React 19 + TypeScript
│   │   ├── src
│   │   │   ├── main        # Electron main process (window, shortcuts, audio, capture)
│   │   │   ├── preload     # Context isolation bridge
│   │   │   └── renderer    # React HUD UI overlay + local Whisper STT
│   │   └── electron-builder.yml
│   └── web                  # Next.js 15 App Router + Tailwind CSS + Supabase
│       ├── src/app         # Dashboard, vault, mock interviews, data-rights, API routes
│       ├── src/hooks       # useSpeechMetrics, useProctoring
│       ├── src/lib         # extractor (unpdf/mammoth), resumeIdentity, groq
│       └── components      # High-end UI components
├── packages
│   ├── shared               # Shared TypeScript types, questionBank, evaluation heuristics
│   ├── eslint-config        # Shared linting configuration
│   └── typescript-config    # Strict tsconfig presets
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```
