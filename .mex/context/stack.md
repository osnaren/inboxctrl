---
name: stack
description: Technology stack, library choices, and the reasoning behind them. Load when working with specific technologies or making decisions about libraries and tools.
triggers:
  - 'library'
  - 'package'
  - 'dependency'
  - 'which tool'
  - 'technology'
edges:
  - target: context/decisions.md
    condition: when the reasoning behind a tech choice is needed
  - target: context/conventions.md
    condition: when understanding how to use a technology in this codebase
  - target: context/architecture.md
    condition: when understanding how a technology fits into the system
last_updated: 2026-07-01
---

# Stack

## Core Technologies

- **TypeScript 6** (`^6.0.3`) — primary language. `strict: true`, `moduleResolution: "bundler"`, `isolatedModules: true`. Shared config in `tsconfig.base.json`.
- **Next.js 16** (App Router) — framework for `apps/web` and `apps/site`. Route handlers in `apps/web/src/app/api/`. Uses `eslint-config-next`.
- **Prisma 5** (`^5.22.0`) — ORM for both SQLite and Postgres. Schema composed from `schema.base.prisma` + provider datasource. No migration files — uses `prisma db push` by default.
- **pnpm 10** (`^10.33.0`) — monorepo package manager. Workspace defined in `pnpm-workspace.yaml` covering `packages/*` and `apps/*`.
- **Node.js 22** — runtime. Docker images use `node:22-bookworm-slim`.

## Key Libraries

- **Vercel AI SDK** (`ai` package, not raw provider SDKs) — unified interface for OpenAI, Anthropic, Gemini, and Groq. Uses `generateText()` for free-form and `generateObject()` with Zod for structured outputs.
- **googleapis** (not raw HTTP) — Gmail API client. Wrapped by `GmailClient` in `packages/gmail` with typed helpers and automatic 401 retry.
- **Better Auth** (not NextAuth/custom) — session management and Google OAuth. Uses Prisma adapter. Client via `better-auth/react`.
- **class-variance-authority** (not plain Tailwind conditionals) — component variant definitions in `packages/ui`.
- **clsx + tailwind-merge** via `cn()` utility — conditional class merging. Used in all components.
- **Zod** — validation for AI structured outputs (`generateObject()` schemas). NOT used for env vars or general request validation.
- **Husky + lint-staged** — git hooks. `prepare` script runs Husky. lint-staged config runs on commit.

## What We Deliberately Do NOT Use

- **No global state management** (no Redux, Zustand, Jotai) — state is local to components or derived from server data via fetch.
- **No `export *` barrel re-exports** — all package barrels use explicit named exports (`export { X }`). Types use `export type { X }`.
- **No default exports** — enforced by ESLint `import/no-default-export: error` (relaxed only for config files and `.tsx`/`.ts`/`.mjs`/`.cjs`).
- **No `mail.google.com/` scope** — the broad Gmail scope is intentionally avoided. Incremental scopes only (`gmail.metadata`, `gmail.modify`, `gmail.settings.basic`, `gmail.labels`).
- **No ORM for env validation** — environment variables are accessed directly via `process.env` at usage sites, no Zod env schema.

## Version Constraints

- TypeScript 6 is in use — features from TS 6.x are available.
- Prisma client is generated to `packages/db/src/generated/client` — never import from `@prisma/client` directly in app code, always through the `@inboxctrl/db` package.
- The Prisma schema file `schema.prisma` is auto-generated — never edit it directly. Edit `schema.base.prisma` or provider files, then run `pnpm db:use`.
