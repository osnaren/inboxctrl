# InboxCtrl

Open-source Gmail control plane for local inbox cleanup, label sync, safe bulk actions, and natural-language filter drafts.

## Repository Shape

```txt
apps/
  web/        Next.js app
  docs/       future docs app
  marketing/  future marketing app

packages/
  core/        public feature IDs and domain types
  plugin-sdk/  optional extension interface
  licensing/   public OSS license provider and feature gates
  config/      shared config parsing
  ai/ gmail/ db/ sync-engine/ rule-engine/ ui/
```

The public app is designed to be useful by itself. Optional extensions can be loaded through package names listed in
`INBOXCTRL_PLUGINS`; the public package does not depend on any private extension package.

## OSS Features

- Gmail OAuth with Better Auth
- Gmail label sync and label CRUD
- Email metadata sync
- Manual bulk actions
- Activity log with basic rollback metadata
- AI-assisted triage and natural-language Gmail filter drafts when an AI provider key is configured
- Local dry-run before filter creation

## Extension Boundary

The public repo exposes extension points for advanced or deployment-specific features without shipping private code or
requiring optional packages for OSS installs. To load an installed extension package, set:

```bash
INBOXCTRL_PLUGINS=@scope/package-name
```

## Local Setup

Prerequisites:

- Node.js
- pnpm
- Google OAuth credentials

Install and prepare the app:

```bash
corepack enable
pnpm install
pnpm prisma:generate
pnpm prisma:push
pnpm dev
```

The web app runs from `apps/web` and uses `apps/web/prisma/schema.prisma`. Keep local secrets in `apps/web/.env`.

Open [http://localhost:3000](http://localhost:3000).

## Environment

Create `apps/web/.env` from `apps/web/.env.example` and provide:

```bash
DATABASE_URL="file:./dev.db"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
INBOXCTRL_PLUGINS=""
```

For local Google OAuth, create a Web application OAuth client in Google Cloud and add this exact authorized redirect URI:

```txt
http://localhost:3000/api/auth/callback/google
```

For deployed/self-hosted installs, set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the public app origin, then add `${BETTER_AUTH_URL}/api/auth/callback/google` in Google Cloud. Google matches the full redirect URI exactly, including `http`/`https`, host, path, case, and trailing slash. Local placeholder Google credentials are allowed for `pnpm build`, but sign-in smoke tests require real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## Validation

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## License

GNU Affero General Public License v3.0 or later. See [LICENSE](LICENSE).
