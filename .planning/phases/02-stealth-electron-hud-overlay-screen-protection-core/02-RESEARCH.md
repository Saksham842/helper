# Phase 2: Stealth Electron HUD Overlay & Screen Protection Core - Research

## Technical Foundation & Core Constraints

### 1. Screen Protection Mechanism (`win.setContentProtection(true)`)
- **Native Implementation**:
  - Windows: Electron invokes `SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)`. In Windows 10 (version 2004+) and Windows 11, this completely removes the window from desktop capture APIs (`BitBlt`, Windows Graphics Capture, Desktop Duplication API) used by Zoom, Microsoft Teams, Google Meet, OBS, Discord, and Slack.
  - macOS: Electron sets `[window setSharingType:NSWindowSharingNone]`, omitting the window from CoreGraphics / ScreenCaptureKit window captures.
- **Verification**:
  - `win.isContentProtected()` returns `true`.
  - Native captures performed via `desktopCapturer` or screen-share tools will see the content beneath the overlay without any trace of the HUD.

### 2. Focus Neutrality & Anti-Blur Defense
- **The Threat**:
  - Technical coding platforms (HackerRank, CoderPad, CodeSignal, TestGorilla, Mercer Mettl) register JavaScript event listeners for `window.onblur` and `document.addEventListener('visibilitychange')`.
  - If a desktop app steals OS focus, the candidate's browser tab fires `blur`, triggering anti-cheat warnings or immediate disqualification.
- **The Solution**:
  - Overlay window is configured with `focusable: false`.
  - When showing or restoring the overlay, never invoke `win.show()` or `win.focus()`. Always invoke `win.showInactive()`.
  - Window level must be set to `alwaysOnTop: true` with level `'screen-saver'` or relative level `1` (`mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)`), and `mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`.
  - In click-through mode, mouse events pass straight through the overlay to the browser/IDE underneath without ever triggering window activation or focus shift.

### 3. OS Stealth & Taskbar Concealment
- **Windows**:
  - `skipTaskbar: true` prevents the window from showing an icon on the Windows Taskbar or appearing in the Alt-Tab switcher when combined with appropriate tool window styling.
  - Transparent frameless style: `transparent: true`, `frame: false`, `hasShadow: false`, `backgroundColor: '#00000000'`.
- **macOS**:
  - `app.dock.hide()` hides the dock icon entirely.
  - Info.plist `LSUIElement: true` guarantees agent status with no Dock or Cmd-Tab representation.

### 4. Click-Through Toggle & Dynamic Mouse Forwarding
- Electron provides `win.setIgnoreMouseEvents(ignore, { forward: true })`.
- When `ignore` is `true`, mouse clicks pass completely through the window to the underlying desktop/browser window.
- When `forward: true` is supplied, mouse movement events can still be captured if needed, or mouse clicks can be toggled via global shortcut (`Ctrl+Shift+M`).
- We also support a dynamic hover bridge: the renderer can notify main when the user hovers over an interactive control vs transparent canvas, allowing seamless interaction without sacrificing pass-through capability.

### 5. Global Hotkeys (`globalShortcut`)
- Because the window is `focusable: false` and often click-through, all core interactions must be 100% controllable via system-wide global shortcuts:
  - `CommandOrControl+Shift+V`: Toggle HUD visibility (`showInactive` / `hide`).
  - `CommandOrControl+Shift+M`: Toggle click-through mode (`setIgnoreMouseEvents`).
  - `CommandOrControl+Shift+Up`: Increase HUD opacity (by 0.1, max 1.0).
  - `CommandOrControl+Shift+Down`: Decrease HUD opacity (by 0.1, min 0.1).
  - `CommandOrControl+Shift+H`: Hotkey for Ask AI / Silent Screen Problem Solver (prepared for Phase 4).
- All shortcuts must safely register on app ready and unregister on app quit via `globalShortcut.unregisterAll()`.

### 6. Architecture & File Layout for Phase 2
- `apps/desktop/src/main/hud.ts`: Dedicated HUD window manager handling window lifecycle, stealth flags, alwaysOnTop level, content protection, and click-through mode.
- `apps/desktop/src/main/shortcuts.ts`: Global shortcut registrar with IPC dispatch.
- `apps/desktop/src/preload/index.ts`: Extended IPC bridge exposing HUD controls (`setClickThrough`, `setOpacity`, `toggleVisibility`, `onHUDStateChange`).
- `apps/desktop/src/renderer/src/components/HUDOverlay.tsx`: Ultra-modern floating HUD overlay with compact/expanded view, glassmorphism, hotkey status pills, opacity meter, and stealth indicator.
- `apps/desktop/tests/stealth.spec.ts`: Automated test harness verifying window flags, content protection, and shortcut mechanics.
