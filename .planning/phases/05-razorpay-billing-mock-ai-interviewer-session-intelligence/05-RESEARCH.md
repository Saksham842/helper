# Phase 5: 100% Free Architecture — Resume Vault, Local Offline Whisper STT & Mock AI Interviewer - Research

## Architectural Deep Dive & Design Patterns

### 1. Resume Vault & Text Extraction (WEB-02)
- **Upload Flow**:
  - Web dashboard provides drag-and-drop file upload accepting `.pdf` and `.docx` up to 10MB.
  - Supabase Storage bucket `resumes` stores the original file securely with Row Level Security (`auth.uid() = user_id`).
- **Text Extraction**:
  - PDF parsing: `pdf-parse` extracts raw plain text on the Node.js server, extracting Experience, Education, Skills, and Project summaries.
  - DOCX parsing: `mammoth` extracts raw text from Word documents cleanly.
  - Extracted text is saved into `documents` table (`extracted_text` column) and exposed via `/api/vault/active` for the desktop copilot HUD prompt engine.

### 2. Elimination of Razorpay & Paid Billing Gates (100% Free Model)
- **Rationale**: Remove all barriers to entry and operational billing complexity. The platform operates 100% free and unlimited for all authenticated users.
- **Scope of Removal**:
  - No `razorpay` npm package or checkout scripts.
  - No payment routes (`/api/billing/order`, `/api/billing/webhook`).
  - No credit checks or deductions before initiating desktop HUD sessions or running Claude AI streaming.
  - Remove `RAZORPAY_*` keys from environment variables.
  - In `apps/web/src/app/dashboard`, replace billing navigation with an "Account & Usage" status page showing unlimited status.

### 3. Local Offline Whisper Speech-to-Text (`@huggingface/transformers`)
- **Technology Choice**:
  - `@huggingface/transformers` (Transformers.js v3) running in Electron with ONNX Runtime Web.
  - Model: `onnx-community/whisper-base.en` (quantized `q8` or `q4`, ~40MB to 75MB footprint).
  - Runs 100% offline and locally on candidate's CPU/GPU via WebAssembly/WebGPU with zero network calls, zero Deepgram costs, and zero latency jitter.
- **Dual-Channel VAD & Diarization**:
  - The existing `AudioMultiplexer` produces 16kHz Linear16 PCM stereo chunks.
  - Channel 0 (Interviewer loopback) and Channel 1 (Candidate mic) are separated into two ring buffers.
  - A rolling energy-based Voice Activity Detector (VAD) monitors RMS amplitude on each channel independently:
    - Silence threshold: RMS < 0.015 triggers silence counter.
    - Speech detected: RMS >= 0.015 accumulates PCM frames into a rolling speech segment.
    - Pause boundary: 600ms to 900ms of consecutive silence marks speech boundary.
  - The accumulated audio segment (Float32Array resampled to 16kHz) is passed to the local Whisper pipeline:
    ```ts
    const output = await transcriber(audioChunk, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: 'english',
      task: 'transcribe',
    });
    ```
  - Emits `TranscriptMessage` with `speaker: 'interviewer'` or `speaker: 'candidate'`.
  - Seamless drop-in replacement: `QuestionDetector` and `AIAnswerEngine` receive the identical events with zero modification required!

### 4. Zero-Cost Voice AI Mock Interviewer (Web Speech API)
- **Browser-Native Audio**:
  - Speech Recognition: Uses `window.SpeechRecognition` || `window.webkitSpeechRecognition` with `continuous: true` and `interimResults: true`.
  - Speech Synthesis: Uses `window.speechSynthesis` with `SpeechSynthesisUtterance` for speaking interviewer prompts aloud in natural voices.
  - Zero external STT/TTS dependencies.
- **Interactive Practice Rounds**:
  - Tracks: "System Design", "Frontend / Full-Stack", "Algorithms & Data Structures", "Behavioral / Leadership".
  - Candidate answers questions verbally; live transcription displays candidate response; AI evaluates and asks follow-up questions.
  - End of session: Generates comprehensive scorecard covering Technical Accuracy, Communication Clarity, and Structure.

### 5. Post-Call Session Intelligence & Question Bank (WEB-05)
- **Post-Call Analytics Pipeline**:
  - Claude 3.5 Sonnet analyzes full session transcript:
    - Executive Summary & Candidate Impression
    - Strengths & Key Highlights
    - Areas for Improvement & Action Items
    - Detailed Question Breakdown
  - Stored in `sessions.metadata` and displayed on `/dashboard/sessions/[id]`.
- **Question Bank (`/dashboard/questions`)**:
  - Automatically indexes all interview questions encountered in live HUD calls or mock sessions.
  - Categorized by topic (Data Structures, System Design, React, SQL, Behavioral) with search, filter, and model answer cards.
