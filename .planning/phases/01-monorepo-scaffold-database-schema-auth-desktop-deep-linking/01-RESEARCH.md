# Phase 1: Monorepo Scaffold, Database Schema, Auth & Desktop Deep-Linking - Research

**Phase:** 1 (Foundation & Deep-Linking)
**Domain:** Turborepo, Next.js 15, Electron 33, Supabase RLS, Custom Protocol Handlers
**Researched:** 2026-10-24
**Confidence:** HIGH

## Technical Findings & Best Practices

### 1. Turborepo Monorepo with Next.js 15 & Electron + Vite

- **Package Manager**: Use `pnpm` with `pnpm-workspace.yaml`. Turborepo 2.x handles task caching across `apps/*` and `packages/*`.
- **Shared Package Configuration**: `packages/shared` should export TypeScript source directly with path aliases or compile to ESM/CJS so both Next.js App Router (which transpiles workspace packages via `transpilePackages: ['@parakeet/shared']`) and Vite in `apps/desktop` can resolve types and schemas without bundling bottlenecks.
- **Strict TypeScript**: Base `tsconfig.base.json` in root with `"strict": true`, `"noImplicitAny": true`, `"isolatedModules": true`, `"esModuleInterop": true`.

### 2. Supabase Migrations & Row Level Security (RLS)

- **PostgreSQL Schemas**:
  - `profiles`: Primary key `id UUID REFERENCES auth.users ON DELETE CASCADE`, `email TEXT`, `credits_balance INTEGER DEFAULT 50`, `plan_tier TEXT DEFAULT 'free'`.
  - `sessions`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID REFERENCES profiles(id) ON DELETE CASCADE`, `title TEXT`, `mode TEXT`, `language TEXT DEFAULT 'en'`, `custom_instructions TEXT`, `status TEXT DEFAULT 'active'`.
  - `documents`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID REFERENCES profiles(id) ON DELETE CASCADE`, `name TEXT`, `file_path TEXT`, `extracted_text TEXT`.
  - `transcripts`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `session_id UUID REFERENCES sessions(id) ON DELETE CASCADE`, `user_id UUID REFERENCES profiles(id)`, `speaker TEXT CHECK (speaker IN ('interviewer', 'candidate'))`, `content TEXT`, `timestamp BIGINT`.
  - `ai_responses`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `session_id UUID REFERENCES sessions(id) ON DELETE CASCADE`, `question TEXT`, `answer TEXT`, `response_type TEXT`.
  - `credit_transactions`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID REFERENCES profiles(id)`, `amount INTEGER`, `transaction_type TEXT`, `reference_id TEXT`.
- **Row Level Security (RLS)**:
  - `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`
  - Policy: `CREATE POLICY "Users can only access own rows" ON <table_name> FOR ALL USING (auth.uid() = user_id);`
  - For `profiles`: `CREATE POLICY "Users can access own profile" ON profiles FOR ALL USING (auth.uid() = id);`
- **User Creation Trigger**:
  - Automatically create a `profiles` row upon new user registration in `auth.users` via a `SECURITY DEFINER` function and `AFTER INSERT ON auth.users` trigger.

### 3. Desktop Deep-Linking Custom Protocol (`copilot://auth`)

- **Protocol Registration**:
  - Call `app.setAsDefaultProtocolClient('copilot')` early in Electron initialization.
  - On Windows, if running unpackaged in development, pass process arguments:
    ```typescript
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('copilot', process.execPath, [path.resolve(process.argv[1])]);
      }
    } else {
      app.setAsDefaultProtocolClient('copilot');
    }
    ```
- **Single Instance Lock**:
  - Ensure only one instance of the Electron desktop app runs using `app.requestSingleInstanceLock()`.
  - Handle protocol URL on Windows when the app is already running via the `app.on('second-instance', (event, commandLine) => { ... })` event.
  - On macOS, handle via `app.on('open-url', (event, url) => { ... })`.
- **Token Handoff Flow**:
  - Web dashboard generates a cryptographically signed or short-lived auth session token (e.g., Supabase refresh token or JWT).
  - Clicking "Launch Desktop App" in web executes `window.location.href = 'copilot://auth?token=' + token`.
  - Electron parses URL, extracts token, verifies it, stores it in secure session storage, and hydrates the desktop UI.

### 4. Strict Environment Validation with Zod

- Define `env.ts` exporting a validated `env` object using `z.object({ ... })`.
- Validates `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Throws an informative error at startup if any required environment variable is missing or malformed.

### 5. Playwright Smoke Testing

- Configure `@playwright/test` for Next.js web application.
- Tests verify:
  1. Login page loads with all form elements (email input, password input, sign-in button, Google OAuth button).
  2. Input validation triggers on invalid email format.
  3. UI adheres to clean responsive layout without console errors.
