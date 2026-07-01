---
name: setup
description: Dev environment setup and commands. Load when setting up the project for the first time or when environment issues arise.
triggers:
  - 'setup'
  - 'install'
  - 'environment'
  - 'getting started'
  - 'how do I run'
  - 'local development'
edges:
  - target: context/stack.md
    condition: when specific technology versions or library details are needed
  - target: context/architecture.md
    condition: when understanding how components connect during setup
  - target: patterns/modify-database-schema.md
    condition: when the setup issue involves database schema or provider switching
last_updated: 2026-07-01
---

# Setup

## Prerequisites

- **Node.js 22+** — runtime (Docker images use `node:22-bookworm-slim`)
- **pnpm** — enable via `corepack enable` (pnpm 10.33.0)
- **No database server needed for local dev** — SQLite is the default profile

## First-time Setup

**Quick path (demo mode, no Gmail needed):**

1. `corepack enable`
2. `pnpm install` (postinstall runs `db:generate` automatically)
3. `pnpm demo` (resets DB, seeds demo data, starts dev server in demo mode)

**Local development with real Gmail:**

1. `corepack enable`
2. `pnpm install`
3. `cp apps/web/.env.example.sqlite apps/web/.env` (then fill in Google OAuth credentials)
4. `pnpm db:use sqlite` (regenerates `schema.prisma` + `profile.ts` for SQLite)
5. `pnpm db:generate` (generates Prisma client)
6. `pnpm db:push` (pushes schema to the SQLite database)
7. `pnpm dev` (starts the product app on http://localhost:3000)

**Docker self-host (Postgres):**

1. `cp apps/web/.env.example.postgres apps/web/.env` (fill in auth secrets and OAuth)
2. `docker compose --env-file apps/web/.env up --build`

## Environment Variables

**Required:**

- `DATABASE_URL` (required) — connection string. SQLite: `file:./dev.db` resolves to `packages/db/prisma/dev.db`. Postgres: `postgresql://user:pass@host:5432/dbname?schema=public`
- `BETTER_AUTH_SECRET` (required) — secret for signing auth sessions, min 32 chars
- `INBOXCTRL_SECRET` (required) — secret for encrypting BYOK AI keys at rest (AES-256-GCM)
- `BETTER_AUTH_URL` (required) — the app origin for auth callbacks, e.g. `http://localhost:3000`
- `NEXT_PUBLIC_APP_URL` (required) — same origin, exposed to client

**Conditionally required:**

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (required for real Gmail, blank in demo) — Google OAuth credentials
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` / `GROQ_API_KEY` (optional) — environment-level AI key fallbacks. Users can also configure keys via the UI (encrypted at rest).

**Optional:**

- `INBOXCTRL_DEMO_MODE` — set to `"true"` to enable demo mode. Default `"false"`.
- `INBOXCTRL_PLUGINS` — comma-separated plugin package names for extensions.
- `INBOXCTRL_APP_PORT` — override Docker host port (default 3000).

## Common Commands

- `pnpm dev` — starts the product app dev server (`@inboxctrl/web`)
- `pnpm dev:site` — starts the public docs site (`@inboxctrl/site`)
- `pnpm demo` — resets demo DB, seeds demo data, starts dev server in demo mode
- `pnpm build` — builds site then app (`build:site && build:app`)
- `pnpm lint` — ESLint across all packages (`pnpm -r --if-present lint`)
- `pnpm typecheck` — TypeScript project references build + per-package typecheck
- `pnpm db:use sqlite` / `pnpm db:use postgres` — switches Prisma provider (regenerates `schema.prisma` and `profile.ts`)
- `pnpm db:generate` — runs `prisma generate`
- `pnpm db:push` — pushes schema to database (loaded from `apps/web/.env`)
- `pnpm db:studio` — opens Prisma Studio
- `pnpm db:check` — verifies schema provider matches `profile.ts` exports
- `pnpm seed:demo` — seeds demo data (sets `INBOXCTRL_DEMO_MODE=true`)
- `pnpm check:public-boundary` — verifies `apps/site` has no product dependencies

## Common Issues

**Profile mismatch error:** If `db:check` fails or Prisma errors about provider mismatch, run `pnpm db:use sqlite` (or `postgres`) to regenerate `schema.prisma` and `profile.ts` from the base files.

**Port 3000 already in use:** Set `INBOXCTRL_APP_PORT` before starting Docker Compose, or kill the process using the port.

**Demo mode not working:** Ensure `INBOXCTRL_DEMO_MODE=true` is set. The `pnpm demo` script handles this automatically. If running manually, use `cross-env INBOXCTRL_DEMO_MODE=true`.

**Google OAuth redirect mismatch:** The callback URL must match exactly: `{BETTER_AUTH_URL}/api/auth/callback/google`. Common mistake is `http` vs `https` or trailing slash mismatch.

**Prisma client not generated:** Run `pnpm db:generate`. The `postinstall` hook runs this automatically after `pnpm install`, but it can fail silently if the schema has errors.
