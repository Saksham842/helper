# Phase 4: Real-Time AI Answer Engine & Silent Vision Problem Solver - Research

## Architectural Deep Dive & Design Patterns

### 1. Automatic Question Detection & Silence Heuristics (AI-01)
- **The Challenge**:
  - Live technical interviews have conversational banter, affirmations ("mhm", "right", "yeah"), and incomplete sentences. We must reliably identify when the interviewer asks a question and finishes speaking without spamming the AI API.
- **The Solution**:
  - Dual-Trigger Model:
    1. **Heuristic Question Detection**:
       - Filter by speaker role (`speaker === 'interviewer'`).
       - Linguistic markers: Interrogative words ("How", "Why", "What", "Can you explain", "Tell me about", "Could you", "Have you worked with", "?").
       - Silence gate: 1200ms of speaker silence (`candidate` speaks or no new interviewer words for 1.2s) with `is_final: true`.
    2. **Instant Manual Hotkey Prompt**:
       - Candidate can immediately press `Ctrl/Cmd + Shift + H` or click "Ask AI Now" on the HUD at any moment to query Claude on the latest context.

### 2. Context Assembly & Dynamic Prompt Injection (AI-02)
- **Context Components**:
  - **Candidate Resume**: Extracted skills, project achievements, technologies, and bullet points.
  - **Target Role Description**: Job title, required stack, seniority level.
  - **Custom Instructions**: Up to 20,000 characters (e.g. "Answer using STAR method", "Keep responses under 3 bullet points", "Highlight distributed systems experience").
  - **Recent Conversation History**: Last 5-10 transcript turns formatted with speaker attribution.
- **Prompt Structure**:
  - System prompt instructs Claude to act as a world-class real-time technical interview copilot, generating concise, high-impact bullet points designed for at-a-glance scanning during a live video call.

### 3. Silent Desktop Screenshot Capture via `desktopCapturer` (AI-03)
- **The Problem**:
  - Taking a screenshot using Windows Snipping Tool, PrintScreen, or macOS Screencapture causes screen flashes, cursor changes, or clipboard alerts that reveal assistance to interviewers or proctoring software.
- **The Native Solution**:
  - Electron `desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } })`.
  - Runs 100% in-memory in the Electron background process.
  - Zero screen flash, zero clipboard changes, zero cursor flicker.
  - Returns `NativeImage` which converts directly to JPEG/PNG Base64 data URL.

### 4. Claude 3.5 Vision Coding Problem Solver (AI-04)
- When a coding assessment (LeetCode, HackerRank, CoderPad) or system design diagram is on screen:
  1. Hotkey `Ctrl/Cmd + Shift + H` triggers silent screen capture.
  2. The image is sent to Claude 3.5 Sonnet Vision (`claude-3-5-sonnet-20241022`).
  3. Prompt extracts:
     - Exact problem statement and constraints.
     - Optimal time & space complexity approach.
     - Production-ready solution code in candidate's target language (Python, TypeScript, Java, C++, Go).
     - Step-by-step walkthrough of edge cases.
  4. Streamed directly to the HUD overlay in real-time.
