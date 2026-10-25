# Phase 7 Context: IntervieHire Feature Adoption & Docs Overhaul

**Phase:** 07
**Slug:** interviehire-feature-adoption-docs-overhaul
**Date:** 2026-10-25
**Status:** Context gathered — ready for planning

---

## Domain

Port all viable features from the IntervieHire reference project into GhostPilot, overhaul all project documentation to reflect the actual current state (Groq/Llama, unpdf, zero Razorpay), and harden the resume vault with identity extraction metadata.

---

## Decisions

### PDF Extraction (LOCKED — already shipped in 28c28dc)
- Library: `unpdf` (bundled pdfjs, zero Webpack conflict)
- Fallback: raw binary regex (mirrors IntervieHire resume_parser.py)

### Resume Identity Extraction
- Port from: `IntervieHire/dashboard/src/dashboard/resume-analysis.ts`
- Location: `apps/web/src/lib/resumeIdentity.ts`
- Display: vault document card metadata badges (name, email, experience years)
- Trigger: server-side in POST /api/vault/upload after extractTextFromBuffer()
- No AI — pure regex heuristics

### Speech Metrics
- Port from: IntervieHire `useSpeechMetrics.ts`
- Location: `apps/web/src/hooks/useSpeechMetrics.ts`
- Features: filler-word count, WPM, confidence score (0-100)
- Display: post-call analytics on /dashboard/mock results

### Waiting Room UI
- Port from: IntervieHire `WaitingRoom.tsx`
- Location: `apps/web/src/app/dashboard/mock/WaitingRoom.tsx`
- Content: mic/camera device check, countdown, consent banner

### Gaze Proctoring
- Library: WebGazer.js (browser-only)
- Port from: IntervieHire useProctoring.ts + useGazeCalibration.ts
- Location: `apps/web/src/hooks/useProctoring.ts`, `useGazeCalibration.ts`
- Behavior: track off-screen gaze, warning toasts, violation count in results

### AI Tone Heuristics
- Port from: IntervieHire `packages/shared/src/evaluation/`
- Location: `packages/shared/src/evaluation/` (new sub-module)
- Classify: Confident / Hesitant / Scripted / Rambling (WPM + filler + sentence length)

### Data Rights Page
- Port from: IntervieHire `data-rights/page.tsx`
- Location: `apps/web/src/app/dashboard/data-rights/page.tsx`
- API: GET /api/user/export-data, DELETE /api/user/account

### Question Bank Tagging
- Location: `packages/shared/src/questionBank.ts`
- Schema: { id, text, tag: Behavioural|Experience|Teamwork|Strategy|Technical|Coding, hint, difficulty: 1|2|3 }

### Docs Overhaul
1. GEMINI.md — remove Razorpay, update to Groq+Llama, fix stack
2. ROADMAP.md — fix Phase 5 description + add Phase 7
3. .planning/research/ARCHITECTURE.md — update module map
4. .planning/research/STACK.md — add unpdf/groq-sdk, remove anthropic/pdf-parse
5. README.md (root) — create comprehensive project README

## Execution Order
1. Docs overhaul
2. Resume identity extraction
3. Question bank tagging
4. Speech metrics
5. Waiting room UI
6. Gaze proctoring
7. AI tone heuristics
8. Data rights page
