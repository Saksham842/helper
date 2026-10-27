# Phase 13: Candidate Speech Intelligence, Real-Time Answer Evaluation, Linear Chatbot Timeline & Native Context Memory

**Phase**: 13  
**Status**: Context Captured & Locked  
**Date**: 2026-10-27  

---

## 1. Background & Problems Identified

Based on live testing evidence and user screenshots:
1. **Candidate Speech Visibility Clipping (Image 1)**:
   - Candidate spoken text (`👤 YOU`) was appended to the bottom of the previous exchange (e.g. after a long Vision Code solution).
   - Because the card was long, the candidate speech was pushed below the viewport and clipped against the bottom bezel.
   - Auto-scroll only triggered on exchange array length changes, not on transcript updates, and there was zero bottom clearance padding.
2. **Candidate Speech Ignored & Unanswered (Image 2)**:
   - `questionDetector.ts` explicitly dropped all non-interviewer speech (`if (message.speaker !== 'interviewer') return`).
   - When the candidate clarified a garbled question aloud ("Okay, so you are asking about how to design rate limiter"), the system stayed completely silent.
   - Candidate explanations were not evaluated in real-time.
3. **"Multiple Canvases" vs Pure Chatbot (Image 3)**:
   - The `SandwichExchange` model created composite multi-section cards with distinct headers, copy buttons, timestamps, and dividers.
   - It felt like multiple disjointed canvases rather than a smooth, continuous conversational stream like ChatGPT or Claude.
4. **Context Memory Degradation**:
   - `promptEngine.injectSolvedCodeContext` mutated and accumulated strings repeatedly in `customInstructions`.
   - `aiAnswerEngine` flattened all history into a single monolithic string prompt rather than passing native OpenAI/Groq `messages: [...]` arrays.
   - This caused model confusion, hallucinations about garbled speech, and repetition of prior problem titles.

---

## 2. Locked Decisions

### A. Candidate Speech Intelligence & Dual-Mode Handling
- **Topic & Question Recognition**:
  - `questionDetector` processes **both** interviewer and candidate audio streams.
  - When the candidate clarifies or states a question/topic (e.g., *"Okay, so you are asking about how to design rate limiter"*, *"Can we solve this using Two Pointers?"*), the system recognizes the topic and triggers a full solution from the AI Copilot immediately.
- **Real-Time Candidate Answer Evaluation & Coaching**:
  - When the candidate is explaining their approach to a previously asked question, the AI evaluates their spoken answer in real-time.
  - Evaluation structure:
    1. **Feedback**: Validates points made well vs inaccuracies.
    2. **Missed Considerations**: Edge cases, time/space trade-offs, or scaling aspects not yet mentioned.
    3. **What to Say Next**: The exact punchy 1-2 sentences to say out loud to keep the interviewer impressed.

### B. Pure Linear Chatbot Timeline Architecture
- **Eliminate `SandwichExchange`**:
  - Replace compound sandwich cards with a flat, chronological `ChatMessage[]` stream.
  - Each message has:
    - `id`: unique string
    - `role`: `'interviewer'` | `'ai_solution'` | `'candidate'` | `'ai_evaluation'` | `'vision_solution'`
    - `text`: markdown or transcript text
    - `timestamp`: formatted time
    - `isStreaming`: boolean
  - Renders naturally like Claude or ChatGPT:
    - **Interviewer**: Subtle sky/blue badge and question text.
    - **AI Solution**: Emerald/green accent, borderless code with copy button, clean markdown.
    - **Candidate (You)**: Subtle purple/violet badge with crisp transcribed text.
    - **AI Evaluation**: Amber/gold or emerald badge with concise coaching and next-steps guidance.
- **Viewport Visibility & Smooth Auto-Scroll**:
  - Add generous bottom clearance (`paddingBottom: 48px` or a dedicated spacer) to the scroll container.
  - Auto-scroll triggers on new messages, streaming token updates, and candidate speech transcripts, ensuring the latest message is always in full view.

### C. Native Multi-Turn Groq Message Array
- **Proper OpenAI/Groq Message Structure**:
  - Instead of flattening everything into a single user string, pass messages as:
    ```json
    [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "[Interviewer]: Can you design a rate limiter?" },
      { "role": "assistant", "content": "### High-Level Architecture..." },
      { "role": "user", "content": "[Candidate]: I would start with token bucket in Redis..." },
      { "role": "assistant", "content": "### Evaluation & Next Steps..." }
    ]
    ```
- **Context Hygiene**:
  - Fixed rolling memory window (last 6-8 relevant turns) with dedicated slots for active code/screen solutions.
  - Prevent repeated string concatenations in `customInstructions`.
  - Maintain clean role boundaries so the LLM never gets confused about who is speaking.

---

## 3. Success Criteria
1. When candidate says *"Okay, so you are asking about how to design rate limiter"*, the Copilot immediately streams the rate limiter solution.
2. When candidate explains their approach, the Copilot evaluates their spoken answer with feedback and next points to cover.
3. All messages render in a single chronological stream with no compound card boxes.
4. Candidate speech is never cut off or hidden off-screen; auto-scroll keeps the bottom visible with bottom clearance.
5. All 5 test suites pass, TypeScript check 0 errors, and Windows unpacked binary updated.
