# Phase 6: Hardening, Packaging, Stealth Verification & Automated Test Suites — User Acceptance Testing (UAT)

**Phase:** 06  
**Status:** PASSED (Live Production Burn-In Verified)  
**Completed:** 2026-10-25  

## Test Cases & Burn-In Results

| # | Test Item | Description | Expected Result | Status |
|---|---|---|---|---|
| 1 | **Monorepo Typecheck & Lint Cleanliness** | Run `pnpm turbo typecheck` and `pnpm turbo lint` across monorepo | 0 errors across `@ghostpilot/shared`, `@ghostpilot/web`, and `@ghostpilot/desktop` | ✅ PASS |
| 2 | **Web Vitest Unit Test Suite** | Run `pnpm --filter @ghostpilot/web test:unit` | All 4 test files (33 unit tests) pass with 0 failures | ✅ PASS |
| 3 | **Desktop Anti-Detection & Core Logic Suite** | Run `pnpm --filter @ghostpilot/desktop test` | All 5 CJS test suites (21 checks) pass, verifying `WDA_EXCLUDEFROMCAPTURE`, anti-blur, local Whisper, prompt engine, and vision solver | ✅ PASS |
| 4 | **ASAR Cache & Native Addon Unpacking** | Configure `env.cacheDir` to `userData/whisper-models` and expand `asarUnpack` for native `.node`, `.dll`, `onnxruntime-node`, `@huggingface/transformers`, and `sharp` | Zero EROFS attempts inside read-only `resources/app.asar` | ✅ PASS |
| 5 | **Real Production Pipelines (No Mock Takeover)** | Verify real `@huggingface/transformers` (`onnx-community/whisper-base.en`) inference pipeline and Anthropic `claude-sonnet-4-20250514` streaming integration | Real streaming and live inference pipelines execute when keys and audio streams arrive | ✅ PASS |
| 6 | **Stealth Persistence Across Hide/Show Cycles** | Re-assert `setContentProtection(true)`, `setAlwaysOnTop(true, 'screen-saver')`, and `setFocusable(false)` on `showHUD()` | Windows 11 DWM retains `WDA_EXCLUDEFROMCAPTURE` across hide/show toggles (`Ctrl+Shift+V`) | ✅ PASS |
| 7 | **# rea Electron Fuse Verification** | Run `# rea` `inspect_electron_fuses` on `SystemAudioHelper.exe` | Fuses verified on PE binary: `RunAsNode=disabled`, `EnableNodeCliInspectArguments=disabled`, `OnlyLoadAppFromAsar=enabled` | ✅ PASS |
| 8 | **10-Second Live Binary Boot Smoke Test** | Boot packaged `SystemAudioHelper.exe` (`asInvoker` user-space manifest) | Boots cleanly without UAC prompts: PID 19036 running stably at 99.25 MB memory, 0 crash logs, 0 unhandled exceptions | ✅ PASS |
| 9 | **Root Stack Launcher Convenience Script** | Author `start-copilot.bat` and `"start:all"` in root `package.json` | Boots web platform (`http://localhost:3000`) and launches `SystemAudioHelper.exe` overlay concurrently | ✅ PASS |
