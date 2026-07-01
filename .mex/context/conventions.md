---
name: conventions
description: How code is written in this project — naming, structure, patterns, and style. Load when writing new code or reviewing existing code.
triggers:
  - 'convention'
  - 'pattern'
  - 'naming'
  - 'style'
  - 'how should I'
  - "what's the right way"
edges:
  - target: context/architecture.md
    condition: when a convention depends on understanding the system structure
  - target: context/gmail-sync.md
    condition: when working on Gmail, sync, or demo-related code patterns
  - target: patterns/add-api-route.md
    condition: when creating a new API route — follow the template pattern
  - target: patterns/add-gmail-operation.md
    condition: when adding a new Gmail operation — follow the three-layer pattern
last_updated: 2026-07-01
---

# Conventions

## Naming

- **Files**: kebab-case everywhere, no exceptions (`feature-gates.ts`, `mail-sync.service.ts`, `account-status-pill.tsx`).
- **Services in apps/web**: dot-separated suffix (`ai.service.ts`, `gmail.service.ts`, `mail-sync.service.ts`, `db.service.ts`).
- **Functions**: camelCase, verb-first (`getCurrentUser`, `requireGoogleAccountPermission`, `syncUserMailbox`).
- **Constants**: UPPER_SNAKE_CASE for feature IDs and environment keys (`OSS_FEATURE_IDS`, `INBOXCTRL_DEMO_MODE`).
- **Types/Interfaces**: PascalCase, no `I` prefix (`GmailClient`, `SyncDbAdapter`, `ApiRouteError`).
- **Packages**: scoped under `@inboxctrl/` (`@inboxctrl/db`, `@inboxctrl/gmail`, `@inboxctrl/core`).

## Structure

- **Domain packages are framework-agnostic** — `packages/gmail`, `packages/sync-engine`, `packages/rule-engine`, `packages/ai` have zero Next.js or React dependencies. The app layer (`apps/web`) wires them.
- **Barrel exports use explicit named exports** — every package has `src/index.ts` with `export { X }`, never `export *`. Types use `export type { X }`.
- **API routes live in** `apps/web/src/app/api/<domain>/<resource>/route.ts` — e.g., `api/mail/sync/route.ts`, `api/ai/triage/route.ts`, `api/accounts/primary/route.ts`.
- **Business logic lives in services**, not in route handlers — `apps/web/src/lib/services/` contains `gmail.service.ts`, `mail-sync.service.ts`, `ai.service.ts`, `action-engine.ts`.
- **Auth/session logic lives in** `apps/web/src/lib/` — `auth.ts` (server Better Auth config), `auth-client.ts` (client), `session-user.ts` (getCurrentUser), `accounts.ts` (Google account management).
- **Prisma schema is composite** — never edit `schema.prisma` directly. Edit `schema.base.prisma` for models or `providers/*.prisma` for datasource, then run `pnpm db:use`.

## Patterns

**API route template** — every route handler follows this structure:

```typescript
export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));
    const body = await parseJsonObject(req);
    const parsed = parseSomeRequest(body);
    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'organizer');
    const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);
    // ... business logic ...
    return jsonApiSuccess({ ... });
  } catch (error: unknown) {
    console.error('Some Error:', error);
    return handleApiRouteError(error, { code: 'SOME_THING_FAILED', message: 'Human-readable message' });
  }
}
```

**Error handling** — custom error classes extending `Error`, never a Result monad:

```typescript
// Correct — structured error class
class ApiRouteError extends Error { status, code, details }

// Correct — try/catch with handleApiRouteError
catch (error: unknown) { return handleApiRouteError(error, fallback); }

// Wrong — do not use Result types or neverthrow
```

**Demo mode guards** — always check `isDemoMode()` at the service boundary, not in every function:

```typescript
// Correct — in GmailService constructor
constructor(accessToken: string) {
  if (isDemoMode()) { this.client = new DemoGmailService(); }
  else { this.client = new GmailClient({ accessToken }); }
}

// Wrong — checking demo mode in each individual method
```

**Import ordering** — enforced by ESLint, must be: builtin → external → internal → sibling/parent → index → type. React and `next/**` first. `@/**` is internal. Alphabetized, newlines between groups.

## Verify Checklist

Before presenting any code:

- [ ] No default exports (unless in a config file or `.tsx`)
- [ ] Files are kebab-case
- [ ] Package barrel exports are explicit named exports, not `export *`
- [ ] API routes use `jsonApiSuccess()` / `handleApiRouteError()`, not raw `NextResponse.json()`
- [ ] Domain packages have no Next.js/React imports
- [ ] Prisma schema was not edited directly — used `schema.base.prisma` + `pnpm db:use`
- [ ] Demo mode is handled at the service boundary, not scattered through business logic
- [ ] Import ordering matches ESLint rules (builtin → external → internal → sibling → type)
