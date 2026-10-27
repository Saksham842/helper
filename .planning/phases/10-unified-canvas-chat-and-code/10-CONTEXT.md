# Phase 10: Unified Continuous Chatbot Canvas & Full Solution Code Window - Context

**Phase:** 10  
**Status:** Discussed & Decisions Locked  
**Created:** 2026-10-27  

---

## 1. Problem Statement & User Feedback

1. **Live Copilot "Boxes" Issue:**
   - Previous implementation wrapped each conversational turn (`[Interviewer]`, `[AI Copilot]`, `[You]`) into nested, heavy card boxes with thick borders and distinct backgrounds inside an outer container box.
   - User feedback: *"one issue is boxes .... make it compltet canvas dont break into multiple ..... beacuse it is impossible to read in chat copilot section ...... make it like chatbot"*.
   - During live interviews, multi-layered bordered boxes create visual fragmentation, making it difficult to read quickly with peripheral vision.

2. **Code Window Truncation & Box Segmentation:**
   - Previous implementation enclosed the solution into nested sub-cards, and the code solution was too brief / truncated into very few lines.
   - User feedback: *"also in code window ... soultion is in very few lines ... make it complete anvas like intution aand edge cses"*.
   - Candidate needs complete, production-ready, runnable C++ code (complete class method signatures, helper functions, full logic without omitting lines or placeholders) rendered on a continuous, uninterrupted full-height canvas alongside intuition and edge cases.

---

## 2. Locked Implementation Decisions

### 1. Live Copilot: Unified Continuous Chatbot Canvas
- **Zero Nested Boxes:** Remove all outer card boxes, heavy border lines (`border: 1px solid rgba(...)`), and card shadows from individual exchanges.
- **Claude / ChatGPT Stream Layout:**
  - Render an uninterrupted, flowing conversational stream across the full HUD window width.
  - **Speaker Headers:** Clean, minimal identity lines with subtle icons/avatars:
    - `Interviewer` (Cyan/Sky-blue `#38bdf8`): Subtle left accent bar or minimalist header with question text in clean, readable font (`fontSize: 12.5px`, `lineHeight: 1.6`).
    - `AI Copilot` (Emerald `#34d399`): Smoothly indented or seamlessly positioned below the question without an enclosing card box; streaming status pulse and quick-copy action on hover/header.
    - `You (Candidate)` (Violet-slate `#a78bfa`): Subtle transcript text indicating what the candidate spoke, maintaining conversational flow without box boundaries.
- **Dividers:** Optional ultra-faint horizontal rules (`rgba(255, 255, 255, 0.05)`) between major question cycles to keep chronology clear without creating visual boxes.

### 2. Code Window: Continuous Canvas & Complete C++ Implementation
- **Seamless Document Canvas:**
  - Remove outer border card around markdown content in [VisionSolutionCard.tsx](file:///c:/Users/acer/Desktop/parakeet%20ai/apps/desktop/src/renderer/src/components/VisionSolutionCard.tsx).
  - The entire area becomes a unified, scrollable reading canvas where Intuition, C++ Code, and Complexity Analysis flow as sections of a single cohesive document.
- **Expanded, Full C++ Code Generation:**
  - In [visionSolver.ts](file:///c:/Users/acer/Desktop/parakeet%20ai/apps/desktop/src/renderer/src/services/visionSolver.ts) and backend routes:
    - Update prompt instructions: Strictly demand **complete, end-to-end, runnable C++ code** including necessary `#include` directives, helper struct/class definitions (e.g. `TreeNode`, `ListNode` where applicable), full method implementations without skipping lines or using `// ... rest of code`.
    - Increase `max_tokens` from 1500 to **2500** to ensure full implementations are never cut short or abbreviated.
- **Enhanced Code Block Canvas in [markdownRenderer.tsx](file:///c:/Users/acer/Desktop/parakeet%20ai/apps/desktop/src/renderer/src/lib/markdownRenderer.tsx):**
  - Make code blocks clean, modern, and spacious with full vertical height (no inner scrolling or truncation), clean line numbers or syntax styling, and copy buttons that don't crowd the canvas.

---

## 3. Scope & Verification

- **Workspaces Affected:** `apps/desktop` (components `LiveCopilotFeed.tsx`, `VisionSolutionCard.tsx`, `markdownRenderer.tsx`, service `visionSolver.ts`) and tests.
- **Stealth & Quality Constraints:**
  - Must preserve Windows DWM stealth (`setContentProtection(true)`, `focusable: false`).
  - Zero horizontal scrollbars (`overflow-x: hidden`, `overflow-wrap: anywhere`).
  - All 5 desktop tests and monorepo typecheck/lint must pass with 0 errors.
