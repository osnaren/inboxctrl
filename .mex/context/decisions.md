---
name: decisions
description: Key architectural and technical decisions with reasoning. Load when making design choices or understanding why something is built a certain way.
triggers:
  - 'why do we'
  - 'why is it'
  - 'decision'
  - 'alternative'
  - 'we chose'
edges:
  - target: context/architecture.md
    condition: when a decision relates to system structure
  - target: context/stack.md
    condition: when a decision relates to technology choice
  - target: context/gmail-sync.md
    condition: when a decision relates to Gmail or sync design
last_updated: 2026-07-01
---

# Decisions

## Decision Log

### Metadata-first storage — never persist email bodies

**Date:** 2026 (inception)
**Status:** Active
**Decision:** Only store message headers (from, to, subject, date), snippet, and labels in the local DB. Full email bodies are fetched on demand and never persisted.
**Reasoning:** Privacy by default — users self-host and their email content should not be stored beyond what's needed for the inbox control plane. Reduces storage requirements and attack surface.
**Alternatives considered:** Full body caching (rejected — privacy risk, storage bloat for large mailboxes), partial body caching (rejected — complexity without clear benefit).
**Consequences:** Every feature that needs email content (AI summarization, smart replies) must fetch the body at request time. The user explicitly opts into body fetch via `UserSettings.allowFullBodyFetch`.

### Three-tier Gmail permission model — avoid broad mail.google.com scope

**Date:** 2026 (inception)
**Status:** Active
**Decision:** Use incremental OAuth scopes mapped to three permission tiers: `read-only-audit` (metadata + labels), `organizer` (modify + labels), `settings-filter` (settings.basic + labels). Never request the broad `mail.google.com/` scope.
**Reasoning:** Users should grant the minimum access needed for each workflow. The broad scope gives full read/write access to all email content, which is excessive for an inbox management tool.
**Alternatives considered:** Single broad scope (rejected — violates principle of least privilege), two tiers (rejected — conflating read and modify is too coarse).
**Consequences:** The permission model is checked at every API route that touches Gmail. Permission upgrades require re-consent via OAuth. The `gmail.metadata` scope is not explicitly requested — `gmail.modify` implies it.

### Dual database support — SQLite for dev, Postgres for production

**Date:** 2026 (inception)
**Status:** Active
**Decision:** Support both SQLite (local/dev default) and Postgres (Docker/self-host) via a composable Prisma schema and `db:use` provider switching script.
**Reasoning:** SQLite has zero setup friction for local development. Postgres is the production baseline for Docker self-hosting. A single codebase supports both paths.
**Alternatives considered:** Postgres-only (rejected — requires running a database server just to try the app), SQLite-only (rejected — no distributed locking for multi-process deployments).
**Consequences:** The `schema.prisma` file is auto-generated and must never be edited directly. A `check-db-profile.ts` script validates consistency between the schema provider and `profile.ts` exports. `SyncState` table-based locking is only used with Postgres; SQLite uses in-memory locking.

### Demo mode as a first-class concept — structurally block real Gmail access

**Date:** 2026 (inception)
**Status:** Active
**Decision:** Demo mode is detected via `INBOXCTRL_DEMO_MODE=true` and structurally prevents real Gmail API calls by using `DemoGmailService` instead of `GmailClient`. The real client constructor throws `DEMO_MODE_REAL_GMAIL_BLOCKED` in demo mode.
**Reasoning:** The app should be fully explorable without a Google account. Demo mode must be safe — no accidental real API calls, no data leakage.
**Alternatives considered:** Mock/stub at test level only (rejected — doesn't provide a user-facing demo), optional demo with warnings (rejected — too easy to accidentally call real Gmail).
**Consequences:** Every service that touches Gmail checks `isDemoMode()` at construction time. Demo data is seeded via `packages/demo-data` with deterministic fixtures. AI features return pre-computed results in demo mode.

### BYOK AI model — users provide their own API keys

**Date:** 2026 (inception)
**Status:** Active
**Decision:** AI features use the user's own API keys (BYOK) for OpenAI, Anthropic, Gemini, or Groq. No server-side AI proxy or shared keys.
**Reasoning:** Self-hosted model means the operator controls costs and data. No AI provider sees data unless the operator explicitly configures their key. Keys are encrypted at rest with AES-256-GCM.
**Alternatives considered:** Bundled AI with usage billing (rejected — against self-host ethos), no AI features (rejected — too valuable for inbox triage).
**Consequences:** AI features are off by default. Users must configure at least one provider key. Privacy settings (`allowExternalAi`, `allowFullBodyFetch`) gate what data is sent to AI providers.

### Public site boundary — apps/site must not depend on product internals

**Date:** 2026 (inception)
**Status:** Active
**Decision:** `apps/site` (marketing/docs) is architecturally isolated from `apps/web`. No imports of `@inboxctrl/db`, `@inboxctrl/gmail`, `@inboxctrl/ai`, `better-auth`, `prisma`, or `googleapis` are allowed. Enforced by `scripts/check-public-boundary.ts`.
**Reasoning:** The public site should be deployable independently (Vercel, static hosting) without database, auth, or Gmail dependencies. Keeps the attack surface small for the public-facing app.
**Alternatives considered:** Shared app with conditional features (rejected — coupling risk), monorepo but no enforcement (rejected — drift inevitable without CI check).
**Consequences:** `check:public-boundary` runs as a CI check. The site's only API route is `api/search/route.ts` for static docs search.
