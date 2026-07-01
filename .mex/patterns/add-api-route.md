---
name: add-api-route
description: Adding a new API route to the Next.js App Router. The most common task in this project — every feature needs a route.
triggers:
  - 'add endpoint'
  - 'add route'
  - 'new API'
  - 'API route'
  - 'route handler'
edges:
  - target: context/conventions.md
    condition: when unsure about the route template or error handling pattern
  - target: context/gmail-sync.md
    condition: when the route interacts with Gmail or needs permission checks
  - target: patterns/add-gmail-operation.md
    condition: when the new route wraps a Gmail operation
last_updated: 2026-07-01
---

# Add API Route

## Context

All API routes live in `apps/web/src/app/api/<domain>/<resource>/route.ts`. The project has a strict API contract layer in `apps/web/src/lib/api/contracts.ts` and input parsing in `apps/web/src/lib/api/launch-contracts.ts`. Every route must use this contract — no raw `NextResponse.json()`.

## Steps

1. **Create the route file** at `apps/web/src/app/api/<domain>/<resource>/route.ts`.

2. **Import the contract layer:**

   ```typescript
   import { headers } from 'next/headers';
   import { NextRequest } from 'next/server';
   import { jsonApiSuccess, handleApiRouteError, requireAuthenticatedUser } from '@/lib/api/contracts';
   import { getCurrentUser } from '@/lib/session-user';
   import { parseJsonObject } from '@/lib/api/launch-contracts';
   ```

3. **If the route needs Gmail access**, also import:

   ```typescript
   import { requireGoogleAccountPermission, throwPermissionFailure } from '@/lib/accounts';
   ```

   Choose the correct permission tier: `read-only-audit`, `organizer`, or `settings-filter`.

4. **Write the handler** following the template:

   ```typescript
   export async function POST(req: NextRequest) {
     try {
       const requestHeaders = await headers();
       const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));

       // For POST routes — parse and validate input
       const body = await parseJsonObject(req);
       // Add domain-specific validation here

       // If Gmail access needed — check permission tier
       const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'organizer');
       const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);

       // Business logic here

       return jsonApiSuccess({
         /* response data */
       });
     } catch (error: unknown) {
       console.error('RouteName Error:', error);
       return handleApiRouteError(error, {
         code: 'ROUTE_NAME_FAILED',
         message: 'Human-readable failure message',
       });
     }
   }
   ```

5. **Add input parsing** in `apps/web/src/lib/api/launch-contracts.ts` if the route accepts structured input. Follow the existing `parse*` function pattern.

## Gotchas

- **Never use `NextResponse.json()` directly** — use `jsonApiSuccess()` and `handleApiRouteError()` from `contracts.ts`. Older routes use raw responses; new routes must not.
- **`requireAuthenticatedUser()` throws `ApiRouteError(401)` if null** — no need for an explicit null check.
- **`throwPermissionFailure()` throws `ApiRouteError` with the status from the permission result** — don't catch and re-wrap.
- **Demo mode is handled automatically** — `getCurrentUser()` returns the demo user when `INBOXCTRL_DEMO_MODE=true`. `requireGoogleAccountPermission()` returns synthetic demo data with all scopes. No special handling needed in the route.
- **Error codes are UPPER_SNAKE_CASE** — e.g., `SYNC_FAILED`, `BULK_ACTION_FAILED`, `FILTER_CREATE_FAILED`.

## Verify

- [ ] Route file is at `apps/web/src/app/api/<domain>/<resource>/route.ts`
- [ ] Uses `jsonApiSuccess()` / `handleApiRouteError()`, not `NextResponse.json()`
- [ ] Calls `requireAuthenticatedUser()` before any business logic
- [ ] If Gmail access needed, uses `requireGoogleAccountPermission()` with the correct tier
- [ ] Error code is UPPER_SNAKE_CASE
- [ ] Console error message includes the route name for debugging

## Debug

- **401 on every request:** Check that `getCurrentUser()` is being called with `requestHeaders` (not `req.headers`). The `headers()` function from `next/headers` must be awaited.
- **403 permission failure:** Check the permission tier matches the OAuth scopes the user has. Use `read-only-audit` for read-only operations, `organizer` for label/archive/star/trash, `settings-filter` for filter CRUD.
- **Demo mode not working:** Verify `INBOXCTRL_DEMO_MODE=true` is set in the environment. The demo user fallback is in `session-user.ts`, not in the route.

## Update Scaffold

- [ ] Update `.mex/ROUTER.md` "Current Project State" if what's working/not built has changed
- [ ] Update any `.mex/context/` files that are now out of date
- [ ] If this is a new task type without a pattern, create one in `.mex/patterns/` and add to `INDEX.md`
