# Phase 6: Hardening, Packaging, Stealth Verification & Automated Test Suites

## Context & User Decisions

Phase 6 is the final milestone, hardening a fully operational Parakeet AI platform (Phases 1–5 complete, 15/15 plans verified) into a production-ready, distributable, and documented release.

---

### 1. REA Security Audit (Plan 06-01)

**Decision: Static bundle analysis only — no live packaged binary required yet.**

The `# rea` MCP tools will be used to inspect the compiled Vite renderer bundle at `apps/desktop/dist/` and the compiled Electron main process at `apps/desktop/dist-electron/`. The audit will:

- **Analyze the compiled Vite renderer bundle** for any leaked secrets (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_ANON_KEY`) embedded in the JavaScript bundle.
- **Inspect the IPC boundary**: verify that `contextBridge.exposeInMainWorld()` only exposes the whitelisted safe API surface — no raw `ipcRenderer.invoke`, no `require`, no Node globals leaked to the renderer.
- **Verify environment variable hygiene**: confirm that only public variables (prefixed `NEXT_PUBLIC_` in web, Vite-injected `import.meta.env.VITE_*` in desktop) appear in client-side code. Server-side secrets must NOT appear.
- **Document findings** in `.planning/phases/06-.../06-REA-AUDIT.md` and fix any surfaced issues inline.

Electron fuse hardening (`RunAsNode=off`, `EnableNodeCliInspectArguments=off`, `OnlyLoadAppFromAsar=on`) will be configured as part of the `electron-builder.yml` in Plan 06-03, not as a separate REA binary inspection.

---

### 2. Test Suite Strategy (Plan 06-02)

**Decision: Extend existing stack — add Vitest for `apps/web`, keep CJS for `apps/desktop`.**

- **`apps/desktop` (CJS, already passing)**: Retain all 5 existing `.test.cjs` files. Run `pnpm --filter @parakeet/desktop test` to validate.
  - `stealth-verification.cjs` — Electron stealth API checks (7 assertions)
  - `pcm-multiplexer.test.cjs` — Dual-channel PCM interleaving and VU meter math
  - `local-whisper-stt.test.cjs` — VAD chunking, channel diarization, TranscriptMessage format, zero-API-key guarantee
  - `question-detector.test.cjs` — Question detection regex and prompt assembly
  - `vision-capture.test.cjs` — Screenshot sanitization and Vision payload format

- **`apps/web` (NEW — Vitest)**: Add Vitest to test server-side logic without Next.js rendering overhead.
  - Test `lib/extractor.ts` — PDF/DOCX text normalization edge cases
  - Test `api/mock/respond/route.ts` — Simulated response selection logic when `ANTHROPIC_API_KEY` is absent
  - Test `api/mock/evaluate/route.ts` — Rubric scoring calculation logic
  - Test `api/vault/upload/route.ts` — File size and MIME type validation branches

- **Playwright E2E (existing config in `apps/web`)**: Extend `tests/smoke.spec.ts` with:
  - Dashboard navigation smoke test (vault, mock, questions, sessions)
  - Mock interview page renders track selection cards
  - Question bank renders with filter controls
  - `/api/health` returns `{ status: "ok" }`

- **Zero-error gates**: `pnpm turbo typecheck`, `pnpm turbo lint` — both must exit 0.

---

### 3. Electron Builder Packaging (Plan 06-03)

**Decision: Windows (NSIS `.exe`) + macOS (`.dmg`) with neutral process branding.**

**Executable / Process Name**: `SystemAudioHelper`
- Windows: `SystemAudioHelper.exe` (NSIS installer, `SystemAudioHelper Setup 1.0.0.exe`)
- macOS: `SystemAudioHelper.dmg` (signed/unsigned DMG)
- App name displayed in UI: `Parakeet AI` (unchanged)
- Bundle ID: `com.systemaudiosync.helper`

**electron-builder configuration**: `apps/desktop/electron-builder.yml`
- `appId: com.systemaudiosync.helper`
- `productName: SystemAudioHelper`
- Windows: NSIS one-click installer, `requestedExecutionLevel: requireAdministrator` (needed for WASAPI loopback)
- macOS: `.dmg` + `entitlements.mac.plist` granting:
  - `com.apple.security.device.audio-input` (microphone)
  - `com.apple.security.cs.allow-unsigned-executable-memory` (ONNX WASM)
  - `com.apple.security.cs.disable-library-validation` (Electron node native addons)
- Electron fuses in `afterSign`/`afterPack` hook: `RunAsNode=false`, `EnableNodeCliInspectArguments=false`, `OnlyLoadAppFromAsar=true`
- Exclude `node_modules`, `tests/`, `.planning/` from ASAR bundle

**electron-builder** will be added to `apps/desktop/devDependencies`.

---

### 4. Vercel Deployment Configuration (Plan 06-03)

**Decision: Full zero-click Vercel config — `vercel.json` + `/api/health` + `.env.example`.**

- **`apps/web/vercel.json`**: Configures Node.js 20 runtime for API routes, framework `nextjs`, root `apps/web`, output dir `.next`.
- **`apps/web/src/app/api/health/route.ts`**: Returns `{ status: "ok", version: "1.0.0", timestamp: ISO8601 }`.
- **`apps/web/.env.example`**: Documents all required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
  - `ANTHROPIC_API_KEY` — Claude 3.5 API key (optional; fallback mode activates if absent)
- **`apps/desktop/.env.example`**: Documents desktop env vars:
  - `VITE_SUPABASE_URL` — Supabase URL (injected at build)
  - `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- Root `.env.example` pointing to per-app files.

---

### 5. README.md (Plan 06-03)

**Decision: Full production README at repo root.**

Contents:
1. **Project description & badge row** (Node, pnpm, Electron, Next.js, Supabase)
2. **Architecture overview** — ASCII or Mermaid diagram showing: Browser → Next.js (Vercel) → Supabase; Electron HUD → LocalWhisper STT → Claude API
3. **Prerequisites** — Node 20+, pnpm 9+, Supabase CLI (optional), Anthropic API key (optional)
4. **Quick start** — `git clone`, `pnpm install`, env setup, `pnpm dev`
5. **Local dev commands** — per-app commands and turbo commands
6. **First-run Whisper model note** — On first audio capture, `onnx-community/whisper-base.en` (~40MB) downloads from HuggingFace; cached in Electron app data forever after
7. **Desktop overlay launch steps** — `pnpm --filter @parakeet/desktop dev`, hotkeys reference
8. **Vercel deploy button**
9. **Environment variables table** — all required + optional vars
10. **Test commands** — how to run CJS, Vitest, and Playwright
11. **License**

---

## Plan Wave Structure

| Wave | Plans | Parallelism | Rationale |
|------|-------|-------------|-----------|
| Wave 1 | 06-01 (REA Audit) | Solo | Must complete before packaging to fix any issues |
| Wave 2 | 06-02 (Full Test Suite) + 06-03 (Packaging & Deployment) | Parallel | Independent — tests don't block packaging config |

## Deferred / Out of Scope

- **GitHub Actions CI**: A full CI pipeline (typecheck + test + build on PR) is a natural next step but deferred beyond Phase 6. The README will include the commands that a CI pipeline would run.
- **Linux AppImage**: No Linux target for Phase 6. Electron-builder config will include a comment marking it as a future extension.
- **Code signing certificates**: macOS `.dmg` will be configured for signing but will build unsigned if `CSC_LINK` env var is absent. Windows NSIS same.
- **Auto-updater**: Not in scope. `electron-updater` integration is a future milestone.
- **Live `inspect_electron_page` via REA**: Requires a running packaged binary. Deferred until after 06-03 packaging is complete (can be done in a separate audit pass post-Phase 6).
