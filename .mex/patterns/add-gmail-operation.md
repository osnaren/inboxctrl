---
name: add-gmail-operation
description: Adding a new Gmail API operation (message, label, or filter action). Must work through the three-layer architecture and handle demo mode.
triggers:
  - 'gmail operation'
  - 'gmail method'
  - 'new gmail feature'
  - 'label operation'
  - 'filter operation'
  - 'message operation'
edges:
  - target: context/gmail-sync.md
    condition: when understanding the three-layer Gmail architecture, permission model, or demo mode
  - target: context/conventions.md
    condition: when writing the API route for the new operation
  - target: patterns/add-api-route.md
    condition: when creating the route handler for this operation
last_updated: 2026-07-01
---

# Add Gmail Operation

## Context

Gmail operations go through three layers: package client (`packages/gmail`) → app service (`apps/web/src/lib/services/gmail.service.ts`) → demo service (`apps/web/src/lib/demo/demo-gmail.service.ts`). Every operation must work identically in real mode and demo mode. The permission model gates which operations are available at each tier.

## Steps

1. **Add the method to `GmailClient`** in `packages/gmail/src/client.ts`:
   - Add a typed method following the existing pattern (e.g., `listMessages`, `trashMessage`)
   - Use `this.gmail.<resource>.<method>()` from the `googleapis` typed client
   - Return typed results — check existing methods for the return type pattern
   - Export from `packages/gmail/src/index.ts` if the type is needed externally

2. **Add the method to `DemoGmailService`** in `apps/web/src/lib/demo/demo-gmail.service.ts`:
   - Implement the same method signature as `GmailClient`
   - Operate on the in-memory demo state (`this.labels`, `this.messages`, `this.filters`)
   - Return the same shape as the real client
   - Mutations should modify in-memory state directly

3. **Add the method to `GmailService`** in `apps/web/src/lib/services/gmail.service.ts`:
   - The constructor already handles demo vs real mode — just delegate to `this.client.<method>()`
   - If the method needs different signatures for demo vs real, add a wrapper

4. **Create or update the API route** following the `add-api-route.md` pattern:
   - Choose the correct permission tier from `packages/core/src/gmail-permissions.ts`:
     - `read-only-audit` for list/read operations
     - `organizer` for label/archive/star/trash mutations
     - `settings-filter` for filter CRUD
   - Use `requireGoogleAccountPermission()` with the chosen tier

5. **Update demo fixtures** in `packages/demo-data/src/fixtures.ts` if the operation needs demo data beyond what already exists.

## Gotchas

- **Demo mode is checked at construction, not per-call** — `GmailService` decides in its constructor. Do NOT add `isDemoMode()` checks inside individual methods.
- **`createRealGmailClient()` throws `DEMO_MODE_REAL_GMAIL_BLOCKED` in demo mode** — this is a hard guard. If you see this error, the service layer is not routing through `GmailService`.
- **401 retry is in `GmailClient` only** — the `withRetry()` wrapper handles token refresh via `onTokenRefresh`. 429 backoff is in the sync engine, not the client.
- **Permission tiers are cumulative** — `organizer` includes everything `read-only-audit` does. `settings-filter` adds filter CRUD on top of `organizer`. Don't request a higher tier than needed.
- **`extractHeaders()` and `extractTextBody()` are static helpers on `GmailClient`** — use them for parsing message payloads. They handle recursive MIME part traversal.

## Verify

- [ ] New method exists in `GmailClient`, `DemoGmailService`, and `GmailService`
- [ ] Demo implementation operates on in-memory state, never calls Gmail API
- [ ] API route uses the correct permission tier
- [ ] The operation works in both demo mode and real mode
- [ ] Types are exported from `packages/gmail/src/index.ts` if needed externally
- [ ] No `isDemoMode()` checks inside individual methods (handled at construction)

## Debug

- **`DEMO_MODE_REAL_GMAIL_BLOCKED` thrown:** Code is creating a real Gmail client in demo mode. Ensure the route uses `GmailService` (not `GmailClient` directly).
- **401 in real mode but works in demo:** Token refresh may be failing. Check `onTokenRefresh` callback in `GmailClient` and `getGoogleAccessTokenForAccount()` in `accounts.ts`.
- **Permission denied (403):** Check the permission tier. The user may not have the required OAuth scopes. Use `getMissingScopesForGmailPermissionMode()` from `packages/core` to diagnose.

## Update Scaffold

- [ ] Update `.mex/ROUTER.md` "Current Project State" if what's working/not built has changed
- [ ] Update any `.mex/context/` files that are now out of date
- [ ] If this is a new task type without a pattern, create one in `.mex/patterns/` and add to `INDEX.md`
