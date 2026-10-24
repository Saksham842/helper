# Plan 02-02 Summary: Screen Protection, Click-Through Engine & Global Shortcuts

## Achievements
- Configured native screen protection via `win.setContentProtection(true)`, automatically applying Win32 `WDA_EXCLUDEFROMCAPTURE` on Windows and `NSWindowSharingNone` on macOS. The HUD window is 100% invisible to Zoom, Teams, Meet, Discord, and screen capture software.
- Implemented click-through engine in `HUDWindowManager`:
  - `setClickThrough(enabled)` using `win.setIgnoreMouseEvents(enabled, { forward: true })`.
  - Dynamic hover pass-through via IPC channel `hud:set-dynamic-ignore-mouse` allowing clicks outside interactive elements to fall through to the underlying code editor.
  - Opacity adjustment clamped between 0.1 and 1.0.
- Implemented global hotkey registration in [`apps/desktop/src/main/shortcuts.ts`](file:///c:/Users/acer/Desktop/parakeet%20ai/apps/desktop/src/main/shortcuts.ts):
  - `CommandOrControl+Shift+V`: Toggle HUD visibility without stealing OS focus.
  - `CommandOrControl+Shift+M`: Toggle Click-Through pass-through mode.
  - `CommandOrControl+Shift+Up`: Increase HUD opacity (+0.1).
  - `CommandOrControl+Shift+Down`: Decrease HUD opacity (-0.1).
  - `CommandOrControl+Shift+H`: Trigger Ask AI / silent screen capture event.
  - Clean `globalShortcut.unregisterAll()` on `will-quit`.
- Extended preload bridge in [`apps/desktop/src/preload/index.ts`](file:///c:/Users/acer/Desktop/parakeet%20ai/apps/desktop/src/preload/index.ts) with full type-safe IPC controls.
- Added `HUDState` contract to shared package [`packages/shared/src/types/index.ts`](file:///c:/Users/acer/Desktop/parakeet%20ai/packages/shared/src/types/index.ts).

## Verification
- Verified IPC handlers and state synchronization.
- Turbo typecheck and build passed across all packages.
