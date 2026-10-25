# Phase 5: 100% Free Architecture — Resume Vault, Offline Whisper STT & Voice AI Interviewer

## Context & User Decisions

During the Phase 5 kickoff, the architecture was intentionally pivoted from paid third-party APIs and Razorpay monetization to a **100% Free, Unlimited, and Local Offline Architecture**:

### 1. Removal of Billing, Razorpay, & Credit Gates
- **Zero Monetization Barriers**: Completely eliminate all Razorpay dependencies, checkout flows, orders, and credit balance walls.
- **Unlimited Access**: All authenticated users receive unrestricted, unlimited access to copilot sessions, mock interviews, and AI assistance.
- **Environment Cleanup**: Remove `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` from runtime environment validation schemas.

### 2. Replacement of Deepgram Nova-2 with Free Local Offline Whisper STT
- **Zero API Key Requirement**: Eliminate the `DEEPGRAM_API_KEY` requirement and replace the cloud WebSocket STT client.
- **Local Neural Inference**: Integrate `@huggingface/transformers` (running ONNX Runtime Web with quantized `onnx-community/whisper-base.en`) inside the Electron desktop application.
- **Deterministic Multi-Channel Diarization**:
  - The existing Phase 3 `AudioMultiplexer` outputs 16,000 Hz Linear16 PCM stereo audio.
  - Channel 0 (Interviewer loopback) and Channel 1 (Candidate mic) are split into individual VAD (Voice Activity Detection) energy chunkers.
  - Speech chunks are dispatched to the local Whisper inference engine with explicit speaker tags (`[Interviewer]` vs `[Candidate]`).
  - Output events match the existing `TranscriptMessage` interface so downstream Phase 4 components (`QuestionDetector`, `PromptEngine`, `AIAnswerEngine`) work seamlessly with zero breaking changes.
- **Testing**: Add `local-whisper-stt.test.cjs` validating local audio chunking, model initialization, and transcript generation.

### 3. Resume & Document Vault (Supabase Storage + Text Extraction)
- **Document Ingestion**: Support PDF and DOCX uploads (up to 10MB) via Next.js App Router server actions and API routes.
- **Server-Side Extraction**: Use `pdf-parse` for PDF files and `mammoth` for DOCX documents to extract clean plain text.
- **Database & Storage**: Store the original file in Supabase Storage (`resumes` bucket) and save `extracted_text` in the `documents` table.
- **Prompt Injection**: Expose `/api/vault/active` so the desktop copilot can automatically fetch the candidate's active resume text and inject it into Claude 3.5 prompts.

### 4. Zero-Cost Voice AI Mock Interviewer (Web Speech API)
- **Browser-Native Audio**: Use the native `window.SpeechRecognition` / `webkitSpeechRecognition` for real-time speech-to-text in `apps/web`.
- **Browser-Native Speech Synthesis**: Use `window.speechSynthesis` for the AI interviewer voice prompts.
- **Zero Cloud Audio Costs**: No paid voice APIs (no ElevenLabs, no Deepgram, no OpenAI Whisper API).
- **Interactive Practice Rounds**: Multiple tracks (System Design, Frontend/Fullstack, Algorithms, Behavioral) with real-time feedback and dynamic scorecards.

### 5. Post-Call Session Intelligence & Question Bank
- **Session Notes**: Generate executive summaries, question-by-question candidate evaluations, and concrete action items after every call or mock session.
- **Personal Question Bank**: Automatically extract and index interview questions with model answers, category tags, and difficulty ratings.
