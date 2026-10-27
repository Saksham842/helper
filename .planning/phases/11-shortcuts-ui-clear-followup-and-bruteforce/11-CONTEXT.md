# Phase 11: Shortcuts UI Overhaul, Clear Hotkey, Follow-Up Code Bridge & Brute-Force Flow - Context

**Phase:** 11  
**Status:** Discussed & Decisions Locked  
**Created:** 2026-10-27  

---

## 1. Problem Statement & User Feedback

1. **Button Viewport Clipping:**
   - Feedback: *"copy button i sgoing out of window"*
   - When code blocks or control rows flex with `justify-content: space-between`, right-side buttons (e.g. Copy button in code block and action controls) can overflow past the right boundary of the window if containers lack strict width clamping, `box-sizing: border-box`, or right margins.

2. **Vertical Scroll Hotkey Not Working:**
   - Feedback: *"scroll doen shortcut is not wokring"*
   - `scrollContainerRef.current` was not reliably receiving scroll events, or `smooth` scrollBy was ignored when active element or window handled overflow. Needs multi-target scroll dispatch (`scrollContainerRef`, active mode container, `window.scrollBy`) and fallback shortcut support.

3. **Modern Shortcuts UI:**
   - Feedback: *"update ui of shortcuts"*
   - The current hotkey drawer is a plain collapsible list. Needs to be a sleek, premium, modern glass modal/popover featuring clear keycap badges (`Ctrl`, `Shift`, `F`, etc.) organized into intuitive functional groups (Navigation, Copilot, Vision, Stealth).

4. **Dedicated Clear Chat Hotkey:**
   - Feedback: *"also there should be shortcut to clear chat"*
   - User selected: **`Ctrl+Shift+X`** to instantly clear all exchanges and reset rolling memory without touching the mouse.

5. **Brute Force First -> Optimal Code Flow:**
   - Feedback: *"and in code part .. make sure it gives brute force ... with intution first and then optimal"*
   - User selected structure:
     1. **### What to Say Out Loud** (First-person intuition script)
     2. **### Brute Force Approach & Complexity** (Describe brute force, why it is suboptimal, time & space complexity)
     3. **### Optimal Solution (C++)** (Complete, unabbreviated modern C++ code)
     4. **### Optimal Complexity & Edge Cases** (Optimal Time & Space complexity plus critical edge cases)

6. **Follow-Up Context Bridge:**
   - Feedback: *"and if they ask follow up ..... there should be shortcut that i press and context of my qustion immedatiley goes to copilot .. and i can answer the followup"*
   - User selected: **`Ctrl+Shift+F`** (Follow-up)
   - When pressed:
     - Captures the active coding problem & solution markdown from Vision Mode.
     - Automatically injects it into Live Copilot conversation memory (`turnsRef.current`) as an interviewer/solution context exchange.
     - Instantly switches active mode to Live Copilot and starts audio listening so when the interviewer asks a follow-up ("What if numbers are negative?", "Can we optimize space?"), Groq already has the exact code in context!

---

## 2. Locked Implementation Decisions

### 1. Viewport & Layout Clamping
- In `LiveCopilotFeed.tsx`, `VisionSolutionCard.tsx`, and `markdownRenderer.tsx`:
  - Enforce `maxWidth: '100%'`, `width: '100%'`, `boxSizing: 'border-box'`, `overflowX: 'hidden'`.
  - Add explicit right padding/margin to all headers and `<CodeBlock>` components (`paddingRight: '8px'`), ensuring the Copy button is never pushed against or past the right viewport boundary.
  - Simplify secondary control rows with responsive flex-wrapping or compact icon buttons.

### 2. Scroll Reliability
- In `HUDOverlay.tsx` and `App.tsx`:
  - When `scroll_down` or `scroll_up` is received, scroll both `scrollContainerRef.current` AND `window` with fallback `scrollTop += 160`.
  - In `shortcuts.ts`: Register both `Ctrl+Down` and `PageDown` (alias), and `Ctrl+Up` and `PageUp` (alias).

### 3. Clear Chat Hotkey (`Ctrl+Shift+X`)
- Register `CommandOrControl+Shift+X` globally in `shortcuts.ts` sending action `clear_chat`.
- In `LiveCopilotFeed.tsx`, listen for `clear_chat` to immediately wipe `exchanges` and reset `turnsRef.current` to empty.

### 4. Follow-Up Code Bridge (`Ctrl+Shift+F`)
- Register `CommandOrControl+Shift+F` in `shortcuts.ts` sending action `followup_bridge`.
- In `App.tsx`:
  - When `followup_bridge` is triggered:
    - Grab active `solutionMarkdown` from `VisionSolutionCard` (or shared ref/service).
    - If empty, trigger solve first; if already solved, immediately inject into `promptEngine` as context:
      `promptEngine.injectSolvedProblemContext(solutionMarkdown)`
    - Switch view to `live-copilot`.
    - Show sleek banner: *"Code Context Injected · Listening for Follow-up..."*.

### 5. Brute Force -> Optimal Prompt Flow
- Update `visionSolver.ts` and `apps/web/src/app/api/copilot/solve-code/route.ts`:
  - Section 1: `### What to Say Out Loud`
  - Section 2: `### Brute Force Approach & Complexity`
  - Section 3: `### Solution (C++)` (Optimal, complete C++ code)
  - Section 4: `### Complexity & Edge Cases` (Optimal O(...) analysis + edge cases)

### 6. Modern Shortcuts UI Modal
- In `HUDOverlay.tsx`, replace the inline hotkey list with a glassmorphism modal with:
  - Keycap badges: `<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd>`
  - Grouped categories: Core HUD, Live Interview Copilot, Vision DSA Solver.
  - Close button and click-outside dismissal.
