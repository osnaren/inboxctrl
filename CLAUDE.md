# InboxCtrl

> **Session start:** Read `.mex/ROUTER.md` before doing anything else. It routes you to the right context file, pattern, and task guidance. For deeper context on any topic below, load the corresponding `.mex/context/` file.

## What This Is

Open-source, self-hosted Gmail control plane for metadata-first inbox cleanup, safe bulk actions, rollback-aware organization, and natural-language filter drafting.

## Non-Negotiables

- Never persist email bodies — only metadata (headers, snippet, labels)
- Never use the broad `mail.google.com/` scope — incremental scopes only
- Never edit `schema.prisma` directly — edit `schema.base.prisma` then run `pnpm db:use`
- Domain packages (`packages/gmail`, `packages/sync-engine`, `packages/rule-engine`, `packages/ai`) have zero Next.js/React dependencies — keep it that way
- Demo mode must structurally block real Gmail API calls — check `isDemoMode()` at the service boundary, not per-method
- No default exports (ESLint enforced) — named exports only
- No `export *` barrels — explicit `export { X }` and `export type { X }`

## Commands

- Dev: `pnpm dev`
- Demo: `pnpm demo`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- DB switch: `pnpm db:use sqlite` or `pnpm db:use postgres`
- DB generate: `pnpm db:generate`
- DB push: `pnpm db:push`
- DB check: `pnpm db:check`
- Boundary: `pnpm check:public-boundary`
- Tests: `pnpm test:demo-guard` and `pnpm test:api-contracts`

## Best Practices

### Code Style

- Files: kebab-case everywhere (`feature-gates.ts`, not `FeatureGates.ts`)
- Services: dot-separated suffix (`gmail.service.ts`, `mail-sync.service.ts`)
- Functions: camelCase, verb-first (`getCurrentUser`, `requireGoogleAccountPermission`)
- Imports: enforced ordering — builtin → external → internal → sibling → type. React/next first.
- Use `cn()` (clsx + tailwind-merge) for conditional classes in components

### API Routes

> Pattern: `.mex/patterns/add-api-route.md` · Context: `.mex/context/conventions.md`

- Use the contract layer: `jsonApiSuccess()` / `handleApiRouteError()` from `@/lib/api/contracts`
- Never use `NextResponse.json()` directly in new routes
- Always call `requireAuthenticatedUser(await getCurrentUser(requestHeaders))` first
- For Gmail routes: `requireGoogleAccountPermission(userId, headers, '<tier>')` with the correct tier
- Permission tiers: `read-only-audit` → `organizer` → `settings-filter` (cumulative)

### Database

> Pattern: `.mex/patterns/modify-database-schema.md` · Context: `.mex/context/setup.md`

- Schema is composite: `schema.base.prisma` (models) + `providers/*.prisma` (datasource) → auto-generated `schema.prisma`
- After schema changes: `pnpm db:use <provider>` → `pnpm db:generate` → `pnpm db:push`
- Prisma client imports go through `@inboxctrl/db`, never `@prisma/client` directly
- SQLite for dev, Postgres for Docker — both supported via `db:use`

### Error Handling

- Custom error classes extending `Error` (`ApiRouteError`, `GmailApiError`)
- try/catch with `handleApiRouteError()` in routes — no Result monad
- Discriminated union results for permission checks (`{ ok: true, accessToken }` | `{ ok: false, status, body }`)
- Per-message errors in sync are isolated — one failure doesn't abort the batch

### AI Features

> Pattern: `.mex/patterns/add-ai-feature.md` · Context: `.mex/context/architecture.md`

- All AI is BYOK — users provide their own API keys (OpenAI, Anthropic, Gemini, Groq)
- Keys encrypted at rest with AES-256-GCM via `INBOXCTRL_SECRET`
- Check `UserSettings.allowExternalAi` before sending data to providers
- Check `UserSettings.allowFullBodyFetch` before fetching email bodies
- Use `generateText()` for free-form, `generateObject()` with Zod for structured outputs
- Demo mode returns pre-computed fixtures from `packages/demo-data` — never calls real AI

### Demo Mode

> Pattern: `.mex/patterns/add-gmail-operation.md` · Context: `.mex/context/gmail-sync.md`

- Activated by `INBOXCTRL_DEMO_MODE=true`
- `GmailService` constructor routes to `DemoGmailService` — no per-method checks needed
- `createRealGmailClient()` throws `DEMO_MODE_REAL_GMAIL_BLOCKED` as a hard guard
- Seed data: `pnpm seed:demo` / reset: `pnpm demo:reset`
- AI triage returns `demoAi.labelSuggestions` from fixtures

## Project Management

Linear is the active source of truth for all InboxCtrl work. Team: **osLabs**, Project: **InboxCtrl**. See `.mex/context/project-management.md` for workflow, labels, statuses, and issue conventions. GitHub Issues are archived records only.

## Git Conventions

Use conventional commits: `<type>: <emoji> <short description>`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`. See `.mex/context/git-workflow.md` for full rules and examples. Husky runs lint-staged on pre-commit.

## After Every Task

After meaningful work, run GROW:

- Ground: what changed in reality?
- Record: update `.mex/ROUTER.md` and relevant `.mex/context/` files
- Orient: create or update a `.mex/patterns/` runbook if this can recur
- Write: bump `last_updated` on changed scaffold files and run `mex log` when rationale matters

## Navigation

See the note at the top of this file. `.mex/ROUTER.md` is the entry point — it routes to context files, patterns, and task guidance. The routing table in ROUTER.md tells you which `.mex/context/` file to load for each task type.
