---
phase: 01-monorepo-scaffold-database-schema-auth-desktop-deep-linking
plan: 03
status: complete
requirements:
  - WEB-03
  - QUAL-01
---

# Plan 01-03 Summary: Desktop Custom Protocol Handler (copilot://auth), Web Token Handoff & Smoke Tests

## Accomplishments

1. **Desktop Custom Protocol Registration (`copilot://auth`)**:
   - Registered custom protocol in Electron main process (`apps/desktop/src/main/protocol.ts`) using `app.setAsDefaultProtocolClient('copilot')` with Windows dev path handling.
   - Implemented single-instance lock (`app.requestSingleInstanceLock()`) ensuring secondary protocol invocations restore the existing window and send `auth:token-received` IPC events.
   - Added support for cold-start launch via `process.argv` on Windows and `open-url` on macOS.
   - Built context isolation preload bridge (`apps/desktop/src/preload/index.ts`) and React UI status component (`apps/desktop/src/renderer/src/components/AuthStatus.tsx`).

2. **Web Deep-Link Handoff**:
   - Created `/api/auth/desktop-token` endpoint generating short-lived cryptographic session tokens.
   - Created `LaunchDesktopButton` on the web dashboard triggering `copilot://auth?token=...` with automatic protocol redirection and fallback manual copy button.

3. **Playwright Smoke Test Suite**:
   - Configured `apps/web/playwright.config.ts`.
   - Created `apps/web/tests/smoke.spec.ts` testing homepage rendering, login form elements (Email, Password, Sign In, Google OAuth), and unauthenticated dashboard protection.

## Verification Evidence

- `apps/desktop` built successfully with Vite and Electron compiling `dist/index.html`, `dist-electron/main/index.js`, and `dist-electron/preload/index.js`.
- `turbo run build` passed across all workspace packages with 0 errors.
- `turbo run typecheck` passed across `@parakeet/shared`, `@parakeet/desktop`, and `@parakeet/web`.
