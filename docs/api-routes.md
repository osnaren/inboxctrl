# InboxCtrl API Route Contract

> Canonical API surface for InboxCtrl OSS and Pro extensions.
> Last updated: 2026-05-07

## Authentication

All API routes require a valid session (via Better Auth). Unauthenticated
requests return `401 Unauthorized`.

## OSS Routes

### Accounts

| Method | Route                      | Description                        | Permission Mode |
| ------ | -------------------------- | ---------------------------------- | --------------- |
| GET    | `/api/accounts`            | List connected Google accounts     | local-only      |
| GET    | `/api/accounts/status`     | Account + token health status      | local-only      |
| POST   | `/api/accounts/disconnect` | Revoke OAuth tokens and disconnect | local-only      |
| POST   | `/api/accounts/upgrade`    | Trigger incremental scope upgrade  | local-only      |

### Auth

| Method | Route                | Description                         |
| ------ | -------------------- | ----------------------------------- |
| \*     | `/api/auth/[...all]` | Better Auth catch-all (login, etc.) |

### Mail - Sync & List

| Method | Route              | Description                   | Permission Mode |
| ------ | ------------------ | ----------------------------- | --------------- |
| POST   | `/api/mail/sync`   | Trigger label + metadata sync | read-only-audit |
| GET    | `/api/mail/list`   | List cached emails            | read-only-audit |
| GET    | `/api/mail/labels` | List synced labels            | read-only-audit |

### Mail - Bulk Actions

| Method | Route            | Description                        | Permission Mode |
| ------ | ---------------- | ---------------------------------- | --------------- |
| POST   | `/api/mail/bulk` | Bulk archive/trash/label/read/star | organizer       |

### Mail - Activity Log

| Method | Route                              | Description               | Permission Mode |
| ------ | ---------------------------------- | ------------------------- | --------------- |
| GET    | `/api/mail/activity`               | List activity log entries | local-only      |
| POST   | `/api/mail/activity/[id]/rollback` | Rollback a logged action  | organizer       |

### Mail - Filters

| Method | Route               | Description                           | Permission Mode                                       |
| ------ | ------------------- | ------------------------------------- | ----------------------------------------------------- |
| POST   | `/api/mail/filters` | NL to filter draft / dry-run / create | read-only-audit (dry-run) or settings-filter (create) |

### AI

| Method | Route                       | Description                         | Permission Mode            |
| ------ | --------------------------- | ----------------------------------- | -------------------------- |
| POST   | `/api/ai/label-suggestions` | Metadata-only label suggestions     | local cache + AI opt-in    |
| POST   | `/api/ai/apply-suggestions` | Apply accepted AI label suggestions | organizer                  |
| POST   | `/api/ai/summarize`         | Summarise email body                | gmail.readonly + AI opt-in |
| POST   | `/api/ai/reply`             | Generate smart reply draft          | gmail.readonly + AI opt-in |
| POST   | `/api/ai/tasks`             | Extract actionable tasks            | gmail.readonly + AI opt-in |
| POST   | `/api/ai/triage`            | Triage unread cached metadata       | local cache + AI opt-in    |

### Settings

| Method | Route                   | Description                            | Permission Mode |
| ------ | ----------------------- | -------------------------------------- | --------------- |
| GET    | `/api/settings/ai`      | Read AI provider settings              | local-only      |
| POST   | `/api/settings/ai`      | Update AI provider settings            | local-only      |
| POST   | `/api/settings/ai/test` | Test configured provider with no email | local-only      |
| GET    | `/api/settings/privacy` | Read privacy and safety settings       | local-only      |
| POST   | `/api/settings/privacy` | Update privacy and safety settings     | local-only      |

---

## Pro Extension Routes

These routes delegate to optional plugins via the plugin SDK. When the Pro
plugin is not installed, they return **`402 Payment Required`** with:

```json
{
  "error": "Extension feature unavailable",
  "featureId": "<feature-id>",
  "message": "... is implemented by an optional extension and is not included in the default OSS build."
}
```

No stack traces or private implementation hints are included in 402 responses.

| Method | Route                         | Plugin Endpoint ID            | Feature ID                          |
| ------ | ----------------------------- | ----------------------------- | ----------------------------------- |
| POST   | `/api/ai/planner`             | `ai.planner.POST`             | `extension.advanced-label-planner`  |
| POST   | `/api/mail/filters/conflicts` | `mail.filters.conflicts.POST` | `extension.advanced-rule-conflicts` |
| GET    | `/api/mail/filters/recipes`   | `mail.filters.recipes.GET`    | `extension.automation-recipes`      |
| GET    | `/api/mail/filters/xml`       | `mail.filters.xml.GET`        | `extension.filter-xml`              |
| GET    | `/api/mail/intel`             | `mail.intel.GET`              | `extension.sender-intelligence`     |

---

## Route Design Decisions

### Canonical shape

- **OSS routes** live under `/api/{domain}/{resource}` (e.g., `/api/mail/labels`, `/api/ai/triage`).
- **Pro extension routes** live alongside their OSS counterparts under the same
  domain prefix (e.g., `/api/mail/filters/conflicts`), not under a separate
  `/api/pro/*` namespace. This keeps the URL structure intuitive regardless of
  whether the Pro plugin is installed.

### Filters

The current `/api/mail/filters` route remains canonical. It is NOT renamed to
`/api/filters/*`. Filter sub-routes (conflicts, recipes, xml) remain under
`/api/mail/filters/` for consistency.

### Pro endpoint IDs

The plugin SDK uses stable endpoint IDs (e.g., `mail.filters.conflicts.POST`)
that are decoupled from the URL path. Route handlers delegate to the plugin
registry using these IDs. This means Pro plugin implementations can be
hot-swapped without changing the public URL surface.

### Error responses

All error responses follow a consistent shape:

```json
{
  "error": "Short error title",
  "message": "Human-readable explanation",
  "details": "Optional technical details (non-production only)"
}
```

- `401`: Unauthenticated
- `402`: Pro extension feature unavailable
- `403`: Gmail permission mode required (includes `requiredPermissionMode`,
  `missingScopes`)
- `500`: Internal server error (no stack traces in production)

---

## Package Boundaries

| Package                  | Owns                                          | Does NOT own                 |
| ------------------------ | --------------------------------------------- | ---------------------------- |
| `@inboxctrl/gmail`       | Gmail API client, typed operations            | Prisma, sessions, auth       |
| `@inboxctrl/ai`          | AI providers, prompts, schemas, service       | Request handling, session    |
| `@inboxctrl/db`          | Repository contracts, Prisma implementations  | Prisma schema, migrations    |
| `@inboxctrl/sync-engine` | Label + metadata sync orchestration           | Gmail client creation, auth  |
| `@inboxctrl/rule-engine` | Filter validation, dry-run, safety, conflicts | Gmail filter CRUD, Pro logic |
| `@inboxctrl/core`        | Feature IDs, Gmail permissions, mail types    | Business logic               |
| `@inboxctrl/plugin-sdk`  | Plugin contracts, registry, feature gates     | Plugin implementations       |
| `@inboxctrl/licensing`   | OSS license provider, feature-gate interface  | Pro license validation       |
| `apps/web`               | Route handlers, session orchestration, UI     | Domain logic (delegated)     |
