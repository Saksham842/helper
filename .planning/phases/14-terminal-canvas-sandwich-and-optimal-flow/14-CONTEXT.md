# Phase 14: Terminal-Style Infinite Canvas, Streamlined Sandwich Chat & 5-Tier Optimal Solution Flow

**Phase**: 14  
**Status**: Context Captured & Locked  
**Date**: 2026-10-27  

---

## 1. Background & Root Cause Analysis

From user feedback and visual evidence:
1. **Screen Real Estate Wasted on UI Chrome ("Nothing is visible in here")**:
   - The UI had large header bars, badges, metadata rows, card borders, and multi-tier margins on every turn.
   - On a standard overlay window (680px height), over 60-70% of the vertical space was consumed by frames, headers, and badges.
   - The actual code was squished into a tiny fraction of the window, making it impossible to read without excessive manual scrolling.
2. **Stretching & Resizing Quirks**:
   - Nested flexbox containers with `flex: 1` and varying height constraints caused elements to stretch or resize unpredictably during streaming.
   - What the user needs is a **Terminal / Code Buffer**: a rock-solid, static, line-by-line continuous stream (like VS Code output or a terminal emulator) where text and code flow naturally down the page without layout shifts or stretchy flex items.
3. **Missing "Optimal Approach" Concept Before Code**:
   - The user noted: *"and afetr brute force approach also give optimal approach then code of optimal"*.
   - In technical interviews, jumping directly from Brute Force into raw Code is an anti-pattern; interviewers expect the candidate to explain the **Optimal Approach & Strategy** conceptually (the algorithm, why it works, what data structures are used) before presenting the code implementation.
4. **Sandwich Chat Grouping**:
   - When a problem or question is addressed, the user wants the interaction kept together as a cohesive "sandwich":
     `[Interviewer / Topic]` -> `[AI Copilot Solution & Code]` -> `[What You Spoke]`
     so the full conversational context of that specific problem is unified in one continuous block, with zero nested sub-scrolling.

---

## 2. Locked Decisions

### A. Terminal / Code Buffer Infinite Canvas
- **Ultra-Dense, Minimalist Chrome**:
  - Eliminate all bulky card boxes, background wrappers, and multi-line avatar badges.
  - Render with terminal-style clean prefixes:
    - `> INTERVIEWER [time]:` (Sky Blue `#38bdf8`)
    - `> COPILOT [C++]:` (Emerald `#34d399` / Blue `#60a5fa`) with compact inline copy action
    - `> YOU [time]:` (Violet `#a78bfa`)
    - `> COACH:` (Amber `#fbbf24`)
  - Typography: Crisp, high-density, high-legibility terminal/monospace styling (`fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'`), 12px, clean line-height.
  - Zero stretching: Simple static block flow (`display: block` / continuous linear stream) with no stretchy flex layout shifts.
  - Zero inner scrollbars: Exactly one single scrollbar for the entire window buffer, with 56px bottom clearance so lines never hit the bottom bezel.

### B. 5-Tier Structured Coding Solutions
For all DSA, coding, and LeetCode problems (both from live audio and on-screen silent vision capture):
1. **`### INTUITION / WHAT TO SAY`**: Punchy 2-3 sentence verbal script to say immediately to the interviewer.
2. **`### BRUTE FORCE APPROACH`**: The naive solution, how it works, and its Time Complexity $O(...)$ / Space Complexity $O(...)$.
3. **`### OPTIMAL APPROACH`**: The conceptual optimal strategy (which algorithm, data structure, why it works, and how it improves on brute force) to explain to the interviewer *before* coding.
4. **`### OPTIMAL C++ CODE`**: Complete, clean, runnable modern C++20 code with minimal comments and zero omitted lines.
5. **`### OPTIMAL COMPLEXITY & EDGE CASES`**: Optimal Time Complexity $O(...)$, Space Complexity $O(...)$, and 2-3 critical edge cases to highlight.

### C. Cohesive Sandwich Block Architecture
- Each question/topic exchange is rendered as a clean, unified sandwich unit:
  - Top: The prompt/question (`> INTERVIEWER:` or `> TOPIC:`)
  - Middle: The complete 5-tier solution or answer (`> COPILOT:`)
  - Bottom: Spoken transcript / candidate follow-up (`> YOU:` and `> COACH:`)
- Seamlessly transitions from one exchange to the next in the infinite canvas buffer.
- `Ctrl+Shift+X` clears the buffer and resets state.
- `Ctrl+Shift+H` captures on-screen code and inserts the 5-tier solution directly into the stream.

---

## 3. Success Criteria
1. Visible screen content density increases by >200%: 85-90% of HUD height is dedicated to readable code and text.
2. Zero nested inner scrollbars; exactly one global scrollbar moves the entire terminal buffer.
3. Coding solutions strictly follow the 5-tier sequence: Intuition -> Brute Force -> Optimal Approach -> Optimal C++ Code -> Complexity & Edge Cases.
4. Candidate speech and interviewer questions form clean sandwich blocks in the buffer without visual clutter.
5. All 5 test suites pass, TypeScript check 0 errors, and production binary updated.
