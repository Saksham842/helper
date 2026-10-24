# Phase 1: Monorepo Scaffold, Database Schema, Auth & Desktop Deep-Linking - Context

**Gathered:** 2026-10-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the foundational full-stack skeleton connecting the Turborepo monorepo, Supabase PostgreSQL database schema with Row Level Security (RLS), Next.js 15 App Router authentication, and the Electron desktop client's custom protocol deep-linking (`copilot://auth`).

</domain>

<decisions>
## Implementation Decisions

### Monorepo & Packaging
- **D-01:** Turborepo 2.x orchestration with `pnpm` workspaces for high performance and strict package dependency boundary enforcement.
- **D-02:** Workspace layout:
  - `apps/web`: Next.js 15 (React 19, Tailwind CSS v4/v3, App Router, `@supabase/ssr`).
  - `apps/desktop`: Electron 33+, Vite 6, React 19, TypeScript.
  - `packages/shared`: Shared TypeScript types, Zod schemas, and Supabase client abstractions.

### Database Schema & Security
- **D-03:** Supabase migrations managing 6 core tables:
  1. `profiles`: User account details, `credits_balance` (default 50), `plan_tier`.
  2. `sessions`: Call/interview sessions with `title`, `mode`, `language`, `custom_instructions`, `status`, `save_transcript`.
  3. `documents`: Resume and context files, file paths, and extracted text for LLM prompts.
  4. `transcripts`: Real-time speaker diarized speech snippets (`interviewer` vs `candidate`).
  5. `ai_responses`: AI-generated answers, suggestions, and vision code solutions.
  6. `credit_transactions`: Ledger of all purchases and credit deductions.
- **D-04:** Row Level Security (RLS) enabled on all 6 tables with restrictive policies (`auth.uid() = user_id`). Automatic `profiles` provisioning via `handle_new_user()` trigger on `auth.users`.

### Authentication & Token Handoff
- **D-05:** Next.js 15 web authentication using Supabase Auth supporting Email/Password and Google OAuth with SSR cookie handling.
- **D-06:** Desktop custom protocol `copilot://auth` registered via `app.setAsDefaultProtocolClient('copilot')` on Windows and macOS.
- **D-07:** Web dashboard exposes a "Launch Desktop App" button that mints a session token and opens `copilot://auth?token=...`, which Electron intercepts on launch or via `second-instance` / `open-url` to establish the authenticated session.

### Quality, Validation & Testing
- **D-08:** Strict runtime environment variable validation using Zod in `env.ts` across both web and desktop applications.
- **D-09:** Playwright E2E smoke test suite validating web dashboard login and basic UI rendering.

</decisions>
