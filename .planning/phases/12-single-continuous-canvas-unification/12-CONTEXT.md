# Phase 12: Single Continuous Canvas Unification - Context

**Phase:** 12  
**Status:** Decisions Locked via User Alignment  
**Created:** 2026-10-27  

---

## 1. Problem Statement & User Request

The user observed:
> *"in code solution it is still different than other canvas .. why is it separate .... keep entire page as single ... dont make code part as a section sepaarate scrollable .. it is not visible if screen is short"*

### Root Causes Identified:
1. **Two Separate Screens/Modes in HUD:**
   - Previously, the HUD had two modes: "Live Copilot" and "Vision Problem Solver" (`activeMode === 'vision-solver'`).
   - Clicking "Solve Screen" or pressing `Ctrl+Shift+H` switched the entire view to `VisionSolutionCard`, which had its own stacked header, language dropdown, back buttons, and separate layout.
   - This felt fragmented and disjointed compared to ChatGPT/Claude where everything lives on a single, continuous stream.
2. **Inner Boxed Framing on Code Solutions:**
   - `<CodeBlock>` in `markdownRenderer.tsx` wrapped code inside a nested card container with its own borders, background, and separate header.
   - On short screens (height < 500px), multiple stacked headers (HUD header + Vision card header + CodeBlock header) combined with nested flex containers consumed nearly the entire visible height, making the actual code solution cut off and hard to read.

---

## 2. Locked Architecture Decisions

1. **Single Unified Page / Stream:**
   - Remove `VisionSolutionCard` as a separate page view from `App.tsx`.
   - Remove the mode toggle buttons ("Copilot" vs "Vision") from `HUDOverlay.tsx`.
   - The HUD overlay has **one single canvas**: the Live Copilot Chatbot Stream.
   - When `Ctrl+Shift+H` is pressed (or the user clicks "Solve Screen"), `visionSolverService.captureAndSolve()` is triggered directly from `LiveCopilotFeed.tsx`.
   - The problem statement & solution streams directly into the active chatbot timeline as an AI exchange turn:
     - Header: `AI Copilot · Vision Solver` in Emerald/Sky-Blue.
     - Content streams live: Intuition script -> Brute force approach -> Optimal C++ code -> Complexity analysis.
   - Because the code solution is part of the chat stream, it is **instantly injected into conversational memory** (`turnsRef.current`). When the interviewer asks a follow-up question, the copilot immediately has full knowledge of the solved problem and code without needing any mode switching or manual bridge hotkeys!

2. **Borderless, Continuous Code Flow:**
   - In `markdownRenderer.tsx`: Remove the boxed card wrapper, borders, and nested container around `<CodeBlock>`.
   - Code renders directly as part of the canvas flow with clean syntax highlighting, a clean minimal language badge & copy button, and natural document flow.
   - No sub-scrolling: `overflowX: 'hidden'`, `overflowY: 'visible'`, `whiteSpace: 'pre-wrap'`, `wordBreak: 'break-word'`, `overflowWrap: 'anywhere'`.
   - The entire HUD scrolls as **one single page**, so on short screens the candidate simply scrolls the main window (`Ctrl+Up/Down`, `PageUp/Down`, or mouse wheel) and reads the full solution effortlessly.
