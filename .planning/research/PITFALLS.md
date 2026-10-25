# Pitfalls Research: GhostPilot Platform

**Domain:** Real-Time AI Copilot, Native Stealth HUD & Audio Processing
**Researched:** 2026-10-24
**Confidence:** HIGH

## Known Pitfalls & Solutions

### 1. Inadvertent Window Focus Stealing

- **Risk**: Calling standard window methods like `show()`, `focus()`, or clicking on the Electron HUD can steal OS window focus away from the candidate's browser window. On proctored platforms like HackerRank, CoderPad, or TestGorilla, this immediately triggers a `blur` or `visibilitychange` penalty flag.
- **Mitigation**:
  - Always instantiate the BrowserWindow with `focusable: false` and `alwaysOnTop: true` with level `'screen-saver'`.
  - Use `win.showInactive()` instead of `win.show()`.
  - Enable click-through by default (`win.setIgnoreMouseEvents(true, { forward: true })`).
  - All interactive commands (toggle HUD, trigger screenshot, scroll text, hide) must be executed strictly via OS-level `globalShortcut` hotkeys.

### 2. Screen Capture Leaks on Specific OS Versions

- **Risk**: On older Windows builds (< Windows 10 build 2004), `SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)` is not supported and falls back to `WDA_MONITOR`, which leaves a black rectangle on screen shares instead of rendering the window transparent.
- **Mitigation**:
  - Check Windows OS version at runtime; ensure `setContentProtection(true)` is applied cleanly.
  - Expose a clear visual test mode on the HUD so the user can verify screen capture invisibility prior to initiating live interview calls.

### 3. Audio Loopback Channel Feedback & Echo

- **Risk**: Capturing microphone audio without echo cancellation can create feedback loops when caller audio plays over loudspeakers.
- **Mitigation**:
  - Recommend headphone usage in setup onboarding.
  - Implement dual-channel separation (System loopback on Channel 1, Microphone on Channel 2).
  - Use Deepgram Nova-2's native multichannel audio diarization to independently transcribe both streams without mixing artifacts.

### 4. High Latency During Live Questioning

- **Risk**: Waiting for an entire sentence or question to conclude before querying the AI model results in 3-5 seconds of dead air during an interview.
- **Mitigation**:
  - Use Deepgram Nova-2 interim results (`is_final: false` with endpointing heuristics) to detect intent early.
  - Stream tokens directly from Anthropic Claude API using Server-Sent Events (SSE) / streaming WebSockets so the candidate sees bullet points beginning within 600-800ms.

### 5. High Memory / CPU Consumption of Desktop HUD

- **Risk**: An unoptimized Electron renderer running full screen can consume significant GPU and CPU resources, causing video call lag or throttling coding IDE execution.
- **Mitigation**:
  - Keep the HUD overlay compact and minimalist.
  - Use CSS hardware acceleration (`will-change: transform`, `backdrop-filter: blur(...)`).
  - Disable heavy background canvas animations during active call sessions.
  - Ensure zero polling intervals; utilize event-driven IPC communication exclusively.

### 6. Process Naming Heuristics

- **Risk**: Certain proctoring tools scan the running process list for keywords like "assistant", "copilot", "cheat", or "interview".
- **Mitigation**:
  - Configure `electron-builder.yml` to package executables under neutral utility names such as `SystemAudioHelper.exe` (Windows) and `SystemAudioHelper.app` (macOS).
  - Use generic system utility icons in production builds.
