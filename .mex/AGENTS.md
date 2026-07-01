---
name: agents
description: Always-loaded project anchor. Read this first. Contains project identity, non-negotiables, commands, and pointer to ROUTER.md for full context.
last_updated: 2026-07-01
---

# InboxCtrl

> **Session start:** Read `ROUTER.md` before doing anything else. It routes you to the right context file, pattern, and task guidance. The routing table tells you which `context/` file to load for each task type.

## What This Is

An open-source, self-hosted Gmail control plane for metadata-first inbox cleanup, safe bulk actions, rollback-aware organization, and natural-language filter drafting.

## Non-Negotiables

- Never persist email bodies — only metadata (headers, snippet, labels) is stored
- Never use the broad `mail.google.com/` scope — incremental scopes only
- Never edit `schema.prisma` directly — edit `schema.base.prisma` and run `pnpm db:use`
- Domain packages (`packages/gmail`, `packages/sync-engine`, `packages/rule-engine`, `packages/ai`) must have zero Next.js or React dependencies
- Demo mode must structurally block real Gmail API calls — no exceptions
- No default exports (ESLint enforced) — named exports only
- No `export *` barrels — explicit `export { X }` and `export type { X }`

## Commands

- Dev: `pnpm dev`
- Demo: `pnpm demo`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- DB schema: `pnpm db:use sqlite` → `pnpm db:generate` → `pnpm db:push`
- DB check: `pnpm db:check`
- Boundary check: `pnpm check:public-boundary`
- Tests: `pnpm test:demo-guard`, `pnpm test:api-contracts`

## Best Practices

### Before Writing Code

1. Check `patterns/INDEX.md` for a matching task pattern
2. Load the relevant `context/` file from the routing table in `ROUTER.md`
3. Follow the pattern's Steps — if deviating, state why before writing code

### API Routes

> Pattern: `patterns/add-api-route.md` · Context: `context/conventions.md`

- Use `jsonApiSuccess()` / `handleApiRouteError()` from `@/lib/api/contracts` — never raw `NextResponse.json()`
- Authenticate via `requireAuthenticatedUser(await getCurrentUser(requestHeaders))`
- Gmail routes: `requireGoogleAccountPermission(userId, headers, '<tier>')` with the correct tier (`read-only-audit`, `organizer`, `settings-filter`)
- Input parsing: add `parse*` functions in `@/lib/api/launch-contracts.ts`

### Database Changes

> Pattern: `patterns/modify-database-schema.md` · Context: `context/setup.md`

- Edit `packages/db/prisma/schema.base.prisma` for models, `providers/*.prisma` for datasource
- Then: `pnpm db:use <provider>` → `pnpm db:generate` → `pnpm db:push` → `pnpm db:check`
- Import Prisma through `@inboxctrl/db`, never `@prisma/client`

### Gmail Operations

> Pattern: `patterns/add-gmail-operation.md` · Context: `context/gmail-sync.md`

- Three-layer architecture: `GmailClient` (package) → `GmailService` (app) → `DemoGmailService` (demo)
- Demo mode is decided at `GmailService` construction — don't check `isDemoMode()` per method
- 401 retry is in `GmailClient.withRetry()`. 429 backoff is in `packages/sync-engine/src/backoff.ts`

### AI Features

> Pattern: `patterns/add-ai-feature.md` · Context: `context/architecture.md`

- BYOK — users provide their own keys. Check `UserSettings.allowExternalAi` before calling providers
- Use `generateText()` for free-form, `generateObject()` with Zod schemas for structured output
- Demo mode returns `demoAi.*` fixtures — never instantiate `AiService` in demo paths

### After Every Task — GROW

- **Ground:** What changed in reality?
- **Record:** Update `ROUTER.md` "Current Project State" and relevant `context/` files
- **Orient:** If this task can recur, create/update a `patterns/` file and add to `INDEX.md`
- **Write:** Bump `last_updated` on changed scaffold files. Run `mex log` when rationale matters.

## Navigation

See the note at the top of this file. `ROUTER.md` is the entry point — it routes to context files, patterns, and task guidance. The routing table tells you which `context/` file to load for each task type.
