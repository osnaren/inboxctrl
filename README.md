# InboxCtrl

InboxCtrl is an open-source, self-hosted Gmail control plane for metadata-first inbox cleanup, safe bulk actions, rollback-aware organization, and natural-language filter drafting.

## Launch posture

- `apps/site` is the public marketing and docs app.
- `apps/web` is the self-host product app.
- Demo mode is local-only and does not call real Gmail.
- SQLite is the local and demo default.
- Docker plus Postgres is the current self-host deployment baseline.
- Hosted SaaS, Cloud, private Pro implementation, Desktop/Tauri packaging, and platform-specific deployment templates beyond Docker are not part of the current OSS launch.

## Repository shape

```txt
apps/
  site/       public marketing and docs app
  web/        self-host product app

packages/
  core/         public feature IDs and permission models
  config/       shared config parsing
  licensing/    OSS feature gates
  plugin-sdk/   optional extension interface
  ai/
  db/
  demo-data/
  gmail/
  rule-engine/
  sync-engine/
  ui/
```

Root `docs/` stays internal engineering documentation. Public launch docs live under `apps/site/content/docs`.

## Quick paths

### Try the app without Gmail

```bash
corepack enable
pnpm install
pnpm demo
```

That resets and reseeds deterministic demo data, starts the product app, and keeps real Gmail access blocked.

### Run the self-host app against your own mailbox

```bash
cp apps/web/.env.example.sqlite apps/web/.env
pnpm install
pnpm db:use sqlite
pnpm db:generate
pnpm db:push
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000), connect Google, and start in the read-only audit path before upgrading permissions.

### Run the Docker self-host baseline

```bash
cp apps/web/.env.example.postgres apps/web/.env
docker compose --env-file apps/web/.env up --build
```

If host port `3000` is already in use, set `INBOXCTRL_APP_PORT` before starting Compose. The bundled Postgres service stays on the internal Docker network by default.

### Run the public site and docs locally

```bash
pnpm dev:site
```

`apps/site` is intentionally separate from the mailbox app and should not require Gmail, database, Better Auth, or AI secrets.

## Environment profiles

Copy the example that matches your path:

- `apps/web/.env.example.sqlite` for local SQLite development
- `apps/web/.env.example.postgres` for Postgres-backed self-hosting
- `apps/web/.env.example.demo` for local demo mode
- `apps/web/.env.example` as a generic baseline if you prefer one starting point

Key launch variables:

```bash
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="generate-a-strong-secret"
INBOXCTRL_SECRET="generate-a-strong-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GOOGLE_GENERATIVE_AI_API_KEY=""
GROQ_API_KEY=""
INBOXCTRL_PLUGINS=""
```

With the SQLite profile, `file:./dev.db` resolves under `packages/db/prisma/dev.db`.

## Gmail permissions

InboxCtrl maps Gmail access into three explicit modes:

- `read-only-audit` for label sync, metadata sync, cached mailbox views, and filter dry-run style workflows
- `organizer` for label application, archive, star, mark read/unread, and trash
- `settings-filter` for creating and managing Gmail filters

The OSS app intentionally avoids the broad `https://mail.google.com/` scope. See [gmail permissions](apps/site/content/docs/gmail-permissions.mdx) and [Google OAuth](apps/site/content/docs/google-oauth.mdx).

## Core OSS features

- Google OAuth with Better Auth
- Gmail label sync and label CRUD
- Cached mailbox metadata sync
- Review-first bulk actions with rollback metadata
- Natural-language filter drafting and dry runs
- AI-assisted triage and drafting when provider keys are configured
- Deterministic demo mode with hard Gmail guards
- Public docs site with static Fumadocs/Orama search

## Public docs

- [Getting started](apps/site/content/docs/getting-started.mdx)
- [Local setup](apps/site/content/docs/local-setup.mdx)
- [Demo mode](apps/site/content/docs/demo-mode.mdx)
- [Google OAuth](apps/site/content/docs/google-oauth.mdx)
- [Database profiles](apps/site/content/docs/database-profiles.mdx)
- [Docker self-hosting](apps/site/content/docs/docker-self-hosting.mdx)
- [Railway](apps/site/content/docs/railway.mdx)
- [Render](apps/site/content/docs/render.mdx)
- [Vercel (public site)](apps/site/content/docs/vercel.mdx)
- [Fly.io and VPS](apps/site/content/docs/flyio-vps.mdx)
- [Managed Postgres](apps/site/content/docs/managed-postgres.mdx)
- [Gmail permissions](apps/site/content/docs/gmail-permissions.mdx)
- [AI settings](apps/site/content/docs/ai-settings.mdx)
- [Privacy and security](apps/site/content/docs/privacy-security.mdx)
- [API overview](apps/site/content/docs/api-overview.mdx)
- [Troubleshooting](apps/site/content/docs/troubleshooting.mdx)

## Launch validation

Core repo checks:

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm build:site
pnpm build:app
pnpm check:public-boundary
pnpm test:api-contracts
pnpm test:demo-guard
```

Database and demo checks:

```bash
pnpm db:use sqlite
pnpm db:generate
pnpm db:push
pnpm demo:reset
pnpm seed:demo
```

Docker and Postgres checks:

```bash
pnpm db:use postgres
pnpm db:generate
pnpm db:check
docker compose --env-file apps/web/.env up --build
docker compose -f docker-compose.demo.yml up --build
docker compose -f docker-compose.site.yml up --build
```

## Extension boundary

The public repo exposes extension points for advanced or deployment-specific features without shipping private code in the OSS package. To load an installed extension package:

```bash
INBOXCTRL_PLUGINS=@scope/package-name
```

## License

GNU Affero General Public License v3.0 or later. See [LICENSE](LICENSE).
