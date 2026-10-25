# Phase 8: Desktop Crash Resilience, HUD Boot Reliability & Diagnostic Logging

## 1. Context & Problem Diagnosis

### Root Causes of Silent Exit & HUD Not Opening:
1. **Renderer File Path Mismatch in `HUDWindowManager.createWindow()`**:
   - `src/main/hud.ts` called `this.window.loadFile(path.join(__dirname, '../renderer/index.html'))`.
   - In production Vite/Electron packaging, the main bundle is at `dist-electron/main/index.js`, while the built web renderer assets reside in `dist/index.html`.
   - Resolving `../renderer/index.html` from `dist-electron/main` resulted in `dist-electron/renderer/index.html` which does not exist, triggering a silent `ERR_FILE_NOT_FOUND` error.
2. **Missing Top-Level Crash and Error Catchers**:
   - `apps/desktop/src/main/index.ts` had no `process.on('uncaughtException')` or `process.on('unhandledRejection')` handlers.
   - Any runtime exception (e.g. file resolution failure, permission query issue) silently crashed the process.
3. **Ghost / Zombie Single-Instance Lock Hijacking**:
   - When a previous instance hung or stayed open in the background without UI, `app.requestSingleInstanceLock()` returned `false`.
   - The secondary process called `app.quit()` immediately with zero console output or log file record.
4. **Silent `loadFile` Promise Rejection**:
   - `this.window.loadFile(...)` was not chained with `.catch(...)`, causing an unhandled promise rejection.
   - No `did-fail-load` event listener was registered to report webContents loading failures.

---

## 2. Locked Implementation Decisions

### 1. Robust File Logging to `userData`
- Create a synchronous log helper `logToFile(level: 'INFO' | 'WARN' | 'ERROR', message: string, err?: any)`:
  - Writes to `path.join(app.getPath('userData'), 'diagnostic.log')` and `error.log`.
  - Ensures the user data directory exists via `fs.mkdirSync(dir, { recursive: true })`.
  - Outputs formatted ISO timestamps, process PID, and error stack traces.
  - Echoes all logs to `console.log` / `console.error` for terminal debugging.

### 2. Top-Level Process Exception Handlers
- Positioned at the very top of `apps/desktop/src/main/index.ts` before any Electron or custom imports:
  - `process.on('uncaughtException', ...)`
  - `process.on('unhandledRejection', ...)`
- Catches all unexpected errors, writes full stack trace to `error.log`, and alerts developer in terminal.

### 3. Single-Instance Lock Diagnostics & Recovery
- When `!gotTheLock`:
  - Log `[Main] Another instance is already running (PID: ...). Forwarding arguments and exiting secondary instance.`
  - Flush logs and call `app.quit()`.
- On `second-instance`:
  - Log incoming `commandLine` arguments.
  - Call `hudManager.showHUD()` to bring the existing overlay to front.
  - If deep link URL present, call `handleDeepLinkUrl(url, hudManager.getWindow())`.

### 4. Resilient Renderer Loading in `HUDWindowManager`
- Check `process.env.VITE_DEV_SERVER_URL` first.
- In production, resolve candidates:
  1. `path.join(app.getAppPath(), 'dist/index.html')` (standard inside ASAR)
  2. `path.resolve(__dirname, '../../dist/index.html')`
  3. `path.resolve(__dirname, '../renderer/index.html')`
- Test candidate existence with `fs.existsSync`.
- Attach `.catch(err => ...)` to `loadFile` and register `webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => ...)` to capture and log any rendering failures.
- Call `this.window.showInactive()` and re-assert `setAlwaysOnTop(true, 'screen-saver', 1)`.

---

## 3. Verification Plan
1. Typecheck: `pnpm --filter desktop typecheck` passes with zero errors.
2. Build: `pnpm --filter desktop build` bundles main, preload, and renderer cleanly.
3. Diagnostic Run: Execute `apps/desktop/release/win-unpacked/SystemAudioHelper.exe` or node harness with console output, verify window creates and loads, and inspect `%APPDATA%\SystemAudioHelper\diagnostic.log`.
