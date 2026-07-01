---
name: gmail-sync
description: Gmail integration, sync engine, demo mode, and the three-tier permission model. Load when working on any Gmail-facing code, sync logic, or demo mode behavior.
triggers:
  - 'gmail'
  - 'sync'
  - 'demo mode'
  - 'oauth'
  - 'permission'
  - 'label sync'
  - 'metadata sync'
  - 'DemoGmailService'
edges:
  - target: context/architecture.md
    condition: when understanding how Gmail fits into the overall system
  - target: context/conventions.md
    condition: when writing Gmail-related code and need to follow patterns
  - target: context/decisions.md
    condition: when understanding why the permission model or demo mode is designed this way
  - target: patterns/add-gmail-operation.md
    condition: when adding a new Gmail API operation
  - target: patterns/debug-sync.md
    condition: when diagnosing sync failures
  - target: patterns/add-api-route.md
    condition: when creating a route that wraps a Gmail or sync operation
  - target: patterns/add-ai-feature.md
    condition: when adding an AI feature that needs email content or demo mode fallback
last_updated: 2026-07-01
---

# Gmail, Sync, and Demo Mode

## Three-Layer Gmail Architecture

The Gmail integration has three layers that must be understood together:

**Layer 1 — Package client** (`packages/gmail/src/client.ts`):

- `GmailClient` wraps `google.gmail({ version: 'v1', auth })` from `googleapis`
- Constructor takes `{ accessToken, onTokenRefresh? }`
- All API calls go through `withRetry()` — catches 401, calls `onTokenRefresh()` for a new token, rebuilds auth, retries once
- Provides typed methods for messages, labels, and filters
- Static helpers: `extractHeaders(msg)` and `extractTextBody(payload)` (recursive MIME part traversal)

**Layer 2 — App service** (`apps/web/src/lib/services/gmail.service.ts`):

- `GmailService` adds demo mode support via constructor check: `isDemoMode()` → use `DemoGmailService` instead
- `GmailService.forUser(userId, headers)` factory looks up the user's Google account and creates the service
- This is what route handlers instantiate

**Layer 3 — Demo service** (`apps/web/src/lib/demo/demo-gmail.service.ts`):

- `DemoGmailService` implements the same interface as `GmailClient`
- Operates entirely on in-memory copies of demo data from `packages/demo-data`
- All mutations modify in-memory state — never touches Gmail API
- `createRealGmailClient()` throws `DEMO_MODE_REAL_GMAIL_BLOCKED` if called in demo mode — hard guard

## Three-Tier Permission Model

Defined in `packages/core/src/gmail-permissions.ts`:

| Tier              | OAuth Scopes                            | Enables                                                    |
| ----------------- | --------------------------------------- | ---------------------------------------------------------- |
| `read-only-audit` | `gmail.metadata` + `gmail.labels`       | Label sync, metadata sync, cached views                    |
| `organizer`       | `gmail.modify` + `gmail.labels`         | Label apply/remove, archive, star, trash, mark read/unread |
| `settings-filter` | `gmail.settings.basic` + `gmail.labels` | Create/delete Gmail filters                                |

**Important:** The broad `mail.google.com/` scope is intentionally NOT requested. The app currently requests `organizer` + `settings-filter` scopes at OAuth time.

Permission is checked at every route via `requireGoogleAccountPermission(userId, headers, tier)`. Returns a discriminated union: `{ ok: true, accessToken }` or `{ ok: false, status, body }`.

## Sync Engine Flow

`packages/sync-engine/src/engine.ts` — `SyncEngine.fullSync(userId)`:

1. **Acquire lock** — `sync:{userId}` key. `InProcessSyncLock` (in-memory `Set<string>`) for SQLite. `PrismaSyncLock` (DB `SyncState` table, 5-min TTL) for Postgres.
2. **Label sync** — `gmail.listLabels()` → iterate → `db.upsertLabel()` for each
3. **Metadata sync** — `gmail.listMessages({ labelIds, maxResults: 50 })` → for each message ID, check `db.findEmail()` → skip if cached → `gmail.getMessageMetadata()` with exponential backoff on 429 (up to 3 retries, 1s→2s→4s, 60s max, with jitter) → parse headers → `db.upsertEmail()`
4. **Per-message error isolation** — one failure does not abort the batch
5. **Report progress** via callback

**App layer** (`apps/web/src/lib/services/mail-sync.service.ts`):

- `MailSyncService.syncUserMailbox(userId, gmailService)` wraps the engine with `PrismaSyncDbAdapter`
- Records `lastSyncAt` on success, `lastError` on failure in `SyncState`

## Demo Mode Safety Model

Demo mode is a structural guarantee, not a convention:

- `isDemoMode()` checks `process.env.INBOXCTRL_DEMO_MODE === 'true'`
- `getCurrentUser()` falls back to demo user `{ id: 'demo-user', email: 'demo@inboxctrl.local' }` when no session exists
- All account functions (`requireGoogleAccountPermission`, `getGoogleAccessTokenForAccount`, etc.) return synthetic demo data with all scopes
- `GmailService` constructor uses `DemoGmailService` — the real `GmailClient` is never instantiated
- AI triage returns pre-computed `demoAi.labelSuggestions` from fixtures
- `UserSettings` has `allowExternalAi: false`, `allowDestructiveActions: false`

**Seed data** (`packages/demo-data`):

- `seedDemoData()` — upserts demo user, account, 6 labels, 4 emails, user settings, activity log
- `resetDemoData()` — deletes all demo user data in a transaction
- `fixtures.ts` — all deterministic constants: `DEMO_USER_ID`, `DEMO_ACCOUNT_ID`, `demoLabels`, `demoEmails`, `demoAi`

## Gotchas

- **Never edit `schema.prisma` directly** — it's auto-generated by `pnpm db:use`. Edit `schema.base.prisma` for models or `providers/*.prisma` for datasource.
- **`gmail.metadata` is not explicitly requested** — `gmail.modify` implies metadata access via scope implication. Don't add it to the OAuth config.
- **Sync lock differs by provider** — `InProcessSyncLock` (in-memory) for SQLite, `PrismaSyncLock` (DB table) for Postgres. Don't assume the lock survives process restarts on SQLite.
- **Demo mode is checked at construction, not per-call** — `GmailService` decides in its constructor. Don't add `isDemoMode()` checks inside individual methods.
- **Backoff is in the sync engine, not in GmailClient** — the client has 401 retry only. 429 backoff is in `packages/sync-engine/src/backoff.ts`.
- **`DEMO_MODE_REAL_GMAIL_BLOCKED` is a hard error** — if you see this, code is trying to create a real Gmail client in demo mode. Fix the service layer, not the error.
