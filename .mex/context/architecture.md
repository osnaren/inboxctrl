---
name: architecture
description: How the major pieces of this project connect and flow. Load when working on system design, integrations, or understanding how components interact.
triggers:
  - 'architecture'
  - 'system design'
  - 'how does X connect to Y'
  - 'integration'
  - 'flow'
edges:
  - target: context/stack.md
    condition: when specific technology details are needed
  - target: context/decisions.md
    condition: when understanding why the architecture is structured this way
  - target: context/gmail-sync.md
    condition: when working on Gmail integration, sync engine, or demo mode
  - target: patterns/modify-database-schema.md
    condition: when changing the database layer or adding new models
last_updated: 2026-07-01
---

# Architecture

## System Overview

Request comes in via Next.js App Router route handler (`apps/web/src/app/api/...`) → `getCurrentUser()` resolves the authenticated user from Better Auth session (or demo user fallback) → `requireGoogleAccountPermission()` validates OAuth scopes against the three-tier permission model → service layer (`GmailService`, `MailSyncService`, `ActionEngine`, `AIService`) → domain packages (`packages/gmail`, `packages/sync-engine`, `packages/rule-engine`, `packages/ai`) → Prisma repository layer (`packages/db`) → SQLite or Postgres. All API responses use a uniform envelope: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.

The system is metadata-first: `EmailMetadata` stores message headers and snippets only — full email bodies are fetched on demand and never persisted. Demo mode (`INBOXCTRL_DEMO_MODE=true`) bypasses every external service call with in-memory stand-ins.

## Key Components

- **packages/core** — public feature IDs (`OSS_FEATURE_IDS`, `EXTENSION_FEATURE_IDS`) and the Gmail three-tier permission model (`read-only-audit`, `organizer`, `settings-filter`). No runtime dependencies — pure types and constants.
- **packages/gmail** — framework-agnostic Gmail API client wrapping `googleapis`. `GmailClient` provides message, label, and filter operations with automatic 401 retry via `onTokenRefresh` callback. Static helpers extract headers and text bodies from MIME parts.
- **packages/sync-engine** — orchestrates Gmail-to-local-DB synchronization. `SyncEngine.fullSync()` runs label sync then metadata sync with per-user locking and exponential backoff on 429 errors. Dependencies injected via `SyncGmailClient` and `SyncDbAdapter` interfaces.
- **packages/rule-engine** — filter validation, local dry-run against cached emails, safety checking (blocks no-op filters, warns on broad/destructive criteria), and conflict detection between filters. No external dependencies.
- **packages/ai** — Vercel AI SDK wrapper supporting OpenAI, Anthropic, Gemini, and Groq (all BYOK). `AiService` provides summarization, smart replies, task extraction, triage, and natural-language-to-filter conversion. Uses `generateObject()` with Zod schemas for structured outputs.
- **packages/db** — Prisma-based data layer with 10 models. Exports repository classes (`PrismaEmailRepository`, `PrismaLabelRepository`, `PrismaAccountRepository`, `PrismaActivityLogRepository`). Supports dual-provider via `db:use` script that regenerates `schema.prisma` from composable parts.
- **packages/plugin-sdk** — extension interface. Plugins implement `InboxCtrlPlugin.register(ctx)` to register features, nav items, and API endpoints. Loaded from `INBOXCTRL_PLUGINS` env var.
- **packages/licensing** — OSS feature gating. `canUseFeature()` always allows OSS features; extension features require a registered plugin and `plan === 'extension'`.
- **packages/demo-data** — deterministic seed data for demo mode. `seedDemoData()` upserts a demo user, account, 6 labels, 4 emails, and pre-computed AI fixtures.
- **packages/config** — plugin name parsing from `INBOXCTRL_PLUGINS` env var. Validates against regex, deduplicates.
- **packages/ui** — shared UI component library. Components use `class-variance-authority` for variants and `cn()` (clsx + tailwind-merge) for class merging.
- **apps/web** — the self-host product app. Next.js 16 App Router. Wires all packages with Better Auth, Prisma, and the API route layer.
- **apps/site** — public marketing and docs app. Intentionally isolated from the product app (enforced by `check:public-boundary` script). No database, no OAuth, no AI.

## External Dependencies

- **Gmail API** (via `googleapis`) — primary integration. Access gated by incremental OAuth scopes. The broad `mail.google.com/` scope is intentionally avoided.
- **Better Auth** — session management and Google OAuth. Uses Prisma adapter. Auth handler mounted at `/api/auth/[...all]`. Token refresh handled via `auth.api.getAccessToken()`.
- **Vercel AI SDK** (`ai` package) — unified interface for four AI providers. All BYOK — keys encrypted at rest with AES-256-GCM using `INBOXCTRL_SECRET`.
- **Prisma** — ORM for both SQLite and Postgres. Schema is a composite of `schema.base.prisma` + provider-specific datasource block. Generated client lives in `packages/db/src/generated/client`.

## What Does NOT Exist Here

- No hosted SaaS or multi-tenant infrastructure — this is a self-host single-user product.
- No background job queue or worker service — sync and actions are request-scoped.
- No real-time/websocket layer — all data refreshes via polling or manual sync triggers.
- No file storage — email attachments and bodies are not persisted; only metadata is cached.
- No analytics or telemetry — no tracking, no usage reporting.
- `apps/site` has no database, auth, or Gmail dependency — enforced by `scripts/check-public-boundary.ts`.
