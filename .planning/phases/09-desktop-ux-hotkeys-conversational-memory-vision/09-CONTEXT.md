# Phase 9: Desktop UX Overhaul, Hotkey Remapping, Conversational Memory & Vision Solver Upgrade

## 1. Context & Objective
Execute a comprehensive UX, Hotkey, Conversational Memory, and Vision Solver upgrade in `apps/desktop` (and `packages/shared` if shared types/prompts are affected). All 8 core requirements must be implemented with zero regressions to Windows DWM stealth (`setContentProtection`, `focusable: false`), anti-blur focus protection, or automated test suites.

---

## 2. Locked Implementation Decisions

### 2.1 Complete Sidebar Removal & Minimal Top Header Bar (`HUDOverlay.tsx`)
- **100% Content Width**: Remove all sidebar navigation/drawer chrome. 100% of the HUD window width is dedicated to active content.
- **Single Ultra-Compact Top Bar (34–36px)**:
  - Frameless draggable window header (`WebkitAppRegion: 'drag'`) with non-draggable interactive pill controls (`WebkitAppRegion: 'no-drag'`).
  - **Status Pills / Indicators**:
    - **Live Copilot Status**: Active (green dot), Listening (cyan pulse), or Idle (slate).
    - **Vision Mode Indicator**: `Vision (Ctrl+Shift+H)` quick button/pill.
    - **Opacity Indicator**: Current % (e.g., `90%`) with quick click or hotkey reminder (`Ctrl+Shift+↑/↓`).
    - **Click-Through Status Badge**: `Click-Through: ON/OFF` (`Ctrl+Shift+M`).
    - **Language Badge**: Default `C++` badge (`cpp`).
  - Subtle hotkey cheatsheet trigger and compact API key configuration drawer.

### 2.2 Responsive Code & Text Wrapping (Zero Horizontal Scrollbars)
- **CSS Wrapping Enforcement**:
  - Root container, all cards, transcript containers, `<pre>`, and `<code>` blocks enforce:
    ```css
    overflow-x: hidden !important;
    max-width: 100% !important;
    white-space: pre-wrap !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    ```
  - In `apps/desktop/src/renderer/src/lib/markdownRenderer.tsx`, replace `overflowX: 'auto'` on `<pre>` blocks with `overflowX: 'hidden'`, `whiteSpace: 'pre-wrap'`, and `wordBreak: 'break-word'`.
  - Guarantee that long lines of C++ code, terminal strings, or transcripts dynamically wrap to the next line based on current HUD window width without triggering any horizontal scrollbar.

### 2.3 Distinct Global Hotkeys for Scrolling vs. Opacity (`shortcuts.ts` + `hud.ts`)
- **Disentangle Conflicting Accelerators**:
  - Remove overlapping hotkeys where `CommandOrControl+Shift+Up/Down` previously modulated opacity and scrolled content simultaneously.
- **Dedicated Vertical Content Scrolling**:
  - `CommandOrControl+Up` (`Ctrl+Up` / `Cmd+Up`): Smooth scroll active content panel UP by 120px without focusing the window.
  - `CommandOrControl+Down` (`Ctrl+Down` / `Cmd+Down`): Smooth scroll active content panel DOWN by 120px without focusing the window.
  - IPC Action sent to renderer: `scroll_up` / `scroll_down`.
- **Dedicated HUD Opacity Adjustment**:
  - `CommandOrControl+Shift+Up` (`Ctrl+Shift+Up` / `Cmd+Shift+Up`): Increase HUD opacity by +10% (+0.10), clamped between 0.20 and 1.00.
  - `CommandOrControl+Shift+Down` (`Ctrl+Shift+Down` / `Cmd+Shift+Down`): Decrease HUD opacity by -10% (-0.10), clamped between 0.20 and 1.00.
  - Directly handled in Electron main via `hudManager.adjustOpacity(+0.1 / -0.1)` and broadcast to renderer.
- **Subtle Legend**: Display hotkey hints subtly in the top header or quick cheatsheet tooltip.

### 2.4 Global Hotkey to Launch / Toggle "Live Copilot Mode" (`Ctrl+Shift+L`)
- **Hotkey Registration**: Register `CommandOrControl+Shift+L` in `shortcuts.ts`, broadcasting `toggle_live_copilot` to renderer.
- **Mode Switching & Clean Screen State**:
  - When pressed from Vision Solver or other view: Instantly switches HUD view to the **Live Copilot Mode**.
  - When pressed while already in Live Copilot Mode: Resets the active conversation stream to a clean blank translucent slate, ready for the next problem/question exchange.
  - Ensures the dual-channel loopback + mic audio capture and local Whisper STT pipeline are automatically running.
  - Displays minimal action controls at the top of the feed: `Pause/Resume Mic`, `Solve Screen [Ctrl+Shift+H]`, `Clear Context`, `Click-Through [Ctrl+Shift+M]`.

### 2.5 Color-Coded "Sandwiched" Conversation Timeline (`LiveCopilotFeed.tsx`)
- Replace the disjointed single-question card and raw transcript list with a unified, chronological, auto-scrolling **Sandwich Timeline**:
  1. **Interviewer Question Block (`[Interviewer]`)**:
     - Border: Amber/Cyan accent (`#38bdf8` / sky-blue header).
     - Crisp, high-contrast readable question text with timestamp.
  2. **AI Suggested Answer Block (`[AI Copilot]`)**:
     - Rendered directly below that interviewer question.
     - Border: Emerald/Green accent (`#34d399` emerald tint).
     - Streams token-by-token from Groq `llama-3.3-70b-versatile` / `qwen/qwen3.8-27b`.
  3. **Candidate Spoken Response Block (`[You]`)**:
     - Captured from candidate mic channel via local Whisper.
     - Rendered directly below the AI suggestion in a Muted Slate/Purple card (`#a78bfa` / violet-slate tint).
- Smooth auto-scrolling to the latest exchange with manual scroll override via mouse or `Ctrl+Up` / `Ctrl+Down`.

### 2.6 Rolling Multi-Turn Conversational Context (Follow-Up Awareness)
- **Active State History Structure**:
  - `Array<{ id: string; role: 'interviewer' | 'ai_suggestion' | 'candidate_spoken'; text: string; timestamp: number }>`
- **Follow-Up Injection in `PromptEngine`**:
  - When the interviewer asks a follow-up or counter-question, include prior turns in the user prompt:
    - What the interviewer asked (`[Interviewer]`)
    - What AI suggested (`[AI Copilot]`)
    - What the candidate actually said out loud (`[Candidate Spoken]`)
  - Instruct the system prompt to explicitly reconcile what the candidate actually said with the interviewer's follow-up probe and provide the strongest, most natural continuation/defense answer.

### 2.7 Instant Mode Switch to "Question Solving Page" (`Ctrl+Shift+H`) & Vision Order
- **State-Preserving View Switcher**:
  - Keep both Live Copilot and Vision Solver views preserved in memory (hidden/visible via CSS display/visibility or tab state).
  - Pressing `Ctrl+Shift+H` immediately switches to the **Question Solving Page**, takes silent screenshot, and triggers solver while audio capture continues silently in the background.
  - Pressing `Ctrl+Shift+L` switches back to Live Copilot without losing the solved code or reset state.
- **Strict Output Ordering for Groq Vision Solver**:
  1. **What to Say Out Loud (First-Person Intuition Script)**:
     - 3–4 natural, conversational bullet points written in first-person speech (`"My initial intuition here is to use a monotonic stack because..."`).
  2. **Optimal C++ Solution Code**:
     - Clean, production-ready, auto-wrapping modern C++20 (`std::vector`, STL, `std::unordered_map`) code block with zero horizontal scrollbar.
  3. **Time & Space Complexity Analysis (Placed Strictly AFTER Code)**:
     - Time Complexity: `O(...)` with 1-line justification.
     - Space Complexity: `O(...)` with 1-line justification.
     - Key edge cases to mention to the interviewer.

### 2.8 Default Programming Language Set to C++ (`cpp`) Everywhere
- Default state in `VisionSolutionCard.tsx` / `VisionSolverService`: `C++`.
- `PromptEngine` fallbacks and prompts: `C++` (`cpp`).
- Web API route `/api/copilot/solve-code` default fallback: `C++`.
- Session schemas and test mock payloads: `C++`.

---

## 3. Verification & Quality Plan
1. **Unit & Integration Tests**:
   - `question-detector.test.cjs`: Update to test C++ code prompt defaults, multi-turn dialogue with candidate spoken transcript injection, and follow-up question context.
   - `vision-capture.test.cjs`: Update to verify the new prompt ordering (1: Intuition Script -> 2: C++ Code -> 3: Complexity Analysis placed strictly after code).
   - `stealth-verification.cjs`: Verify 7/7 stealth checks remain 100% intact (`setContentProtection`, `focusable: false`, `isAlwaysOnTop`, click-through).
2. **Typecheck & Linting**:
   - `pnpm turbo typecheck` (0 errors).
   - `pnpm turbo lint` (0 errors).
3. **Packaging & Execution**:
   - Build desktop app: `pnpm --filter desktop build`.
   - Repackage Windows executable: `apps/desktop/release/win-unpacked/SystemAudioHelper.exe`.
