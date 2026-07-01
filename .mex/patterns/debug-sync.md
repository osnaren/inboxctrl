---
name: debug-sync
description: Diagnosing failures in the Gmail-to-local-DB sync pipeline. Covers rate limits, lock contention, profile mismatches, and per-message errors.
triggers:
  - 'sync failed'
  - 'sync error'
  - 'sync not working'
  - 'labels not syncing'
  - 'metadata sync'
  - 'rate limit'
  - '429'
  - 'sync lock'
edges:
  - target: context/gmail-sync.md
    condition: when understanding the sync engine architecture, lock model, or permission tiers
  - target: context/setup.md
    condition: when the issue is related to database profile or environment setup
last_updated: 2026-07-01
---

# Debug Sync

## Context

The sync engine (`packages/sync-engine`) runs in two phases: label sync then metadata sync. It acquires a per-user lock, calls the Gmail API through the `SyncGmailClient` interface, and writes to DB through the `SyncDbAdapter` interface. The app layer (`apps/web/src/lib/services/mail-sync.service.ts`) wraps the engine with Prisma adapters.

## Diagnosis Steps

### 1. Check the sync state in the database

Look at the `SyncState` table for the user:

- `lastResult` — was the last sync successful?
- `lastError` — what was the error message?
- `lastSyncAt` — when did the last sync run?

### 2. Check the permission tier

The sync route requires `read-only-audit` permission. If the user doesn't have `gmail.metadata` + `gmail.labels` scopes, sync will fail at the permission check.

### 3. Check for rate limiting (429 errors)

The metadata sync has exponential backoff: up to 3 retries, starting at 1s, doubling, 60s max, with jitter. If all retries are exhausted, the error is recorded in `SyncState.lastError`.

**Symptoms:** Slow sync, partial sync (some messages synced, others not), error message mentions "rate limit" or "429".

**Fix:** Wait and retry. For large mailboxes, consider increasing `maxResults` or running sync multiple times.

### 4. Check for lock contention

- **SQLite:** `InProcessSyncLock` uses an in-memory `Set<string>`. Locks don't survive process restarts. If the process crashed mid-sync, the lock is released automatically.
- **Postgres:** `PrismaSyncLock` uses the `SyncState` table with a 5-minute TTL. If a sync takes longer than 5 minutes, the lock expires and another sync can start — this can cause duplicate work but not data corruption.

**Symptoms:** "Sync already in progress" error, or sync appears stuck.

**Fix:** For SQLite, restart the dev server. For Postgres, wait for the 5-minute TTL or manually clear the `SyncState` row.

### 5. Check for per-message errors

The sync engine isolates per-message errors — one failure doesn't abort the batch. Check the console for individual error messages. Common causes:

- Malformed message headers (missing `From`, `Subject`, `Date`)
- Invalid date format in the `Date` header
- Gmail API returning unexpected response shape

### 6. Check the database profile

Run `pnpm db:check`. If the profile mismatch error appears, run `pnpm db:use sqlite` (or `postgres`) to regenerate.

## Common Failure Patterns

| Symptom                                | Likely Cause                                                | Fix                                                                      |
| -------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| Sync completes but no emails appear    | `read-only-audit` permission missing `gmail.metadata` scope | Re-authenticate with correct scopes                                      |
| "Sync already in progress"             | Previous sync crashed without releasing lock                | Restart server (SQLite) or wait 5 min (Postgres)                         |
| Partial sync, some messages missing    | 429 rate limit exhausted retries                            | Wait and retry; Gmail rate limits reset over time                        |
| All messages sync but labels are wrong | Label sync ran before metadata sync                         | This is expected — labels sync first, then metadata references them      |
| `DEMO_MODE_REAL_GMAIL_BLOCKED`         | Code path trying to create real Gmail client in demo mode   | Check `GmailService` constructor — it should route to `DemoGmailService` |
| Profile mismatch error                 | `schema.prisma` and `profile.ts` are out of sync            | Run `pnpm db:use sqlite` to regenerate both                              |

## Verify After Fix

- [ ] `POST /api/mail/sync` returns `{ ok: true, data: { labelsSynced, emailsSynced } }`
- [ ] `SyncState.lastResult` shows success
- [ ] Labels appear in the DB (`Label` table)
- [ ] Emails appear in the DB (`EmailMetadata` table) with correct headers
- [ ] Works in both demo mode and real mode

## Update Scaffold

- [ ] Update `.mex/ROUTER.md` "Current Project State" if what's working/not built has changed
- [ ] Update any `.mex/context/` files that are now out of date
- [ ] If this is a new task type without a pattern, create one in `.mex/patterns/` and add to `INDEX.md`
