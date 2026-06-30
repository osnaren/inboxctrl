# InboxCtrl Launch Smoke Matrix

Last verified: 2026-05-10

This note records the current launch-foundation smoke matrix for the OSS repo. It is an internal validation artifact, not part of the public docs set under `apps/site/content/docs`.

## Scope

The matrix covers:

- local SQLite path
- Postgres profile path
- demo seed flow
- Docker app plus Postgres smoke
- Docker demo smoke
- Docker public site smoke
- public boundary expectations around secrets and health checks

## Matrix

| Area                        | Commands                                                                                                                   | Expected pass criteria                                                                                                                                              | Latest result |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| SQLite profile              | `pnpm db:use sqlite`                                                                                                       | Prisma schema/profile switches to sqlite without error.                                                                                                             | Passed        |
| SQLite schema sync          | `pnpm db:push`                                                                                                             | Prisma reports the SQLite database is in sync or updates it successfully. Client generate also succeeds when no running process is locking the Prisma query engine. | Passed        |
| Demo seed                   | `pnpm seed:demo`                                                                                                           | Demo fixtures seed successfully with `INBOXCTRL_DEMO_MODE=true`.                                                                                                    | Passed        |
| Postgres profile            | `pnpm db:use postgres`                                                                                                     | Prisma schema/profile switches to postgres without error.                                                                                                           | Passed        |
| Postgres migrations         | `$env:DATABASE_URL='postgresql://postgres:postgres@localhost:15432/inboxctrl?schema=public'; pnpm db:migrate:deploy`       | Prisma connects to Postgres and reports either applied migrations or no pending migrations.                                                                         | Passed        |
| Docker app plus Postgres    | `$env:INBOXCTRL_APP_PORT='13000'; docker compose -p inboxctrl-osn92-app up -d --build --wait`                              | App and DB containers become healthy. `GET http://localhost:13000/api/health` returns `200` with a shallow no-secrets JSON payload.                                 | Passed        |
| Docker demo mode            | `$env:INBOXCTRL_DEMO_PORT='13002'; docker compose -p inboxctrl-osn92-demo -f docker-compose.demo.yml up -d --build --wait` | Demo container becomes healthy. `GET http://localhost:13002/api/health` returns `200` with the shallow health payload.                                              | Passed        |
| Docker public site          | `$env:INBOXCTRL_SITE_PORT='13001'; docker compose -p inboxctrl-osn92-site -f docker-compose.site.yml up -d --build --wait` | Site container becomes healthy. `GET http://localhost:13001/docs` returns `200` HTML.                                                                               | Passed        |
| Public site secret boundary | `docker compose -p inboxctrl-osn92-site -f docker-compose.site.yml up -d --build --wait`                                   | The site image boots without Google OAuth credentials, Better Auth secrets, database URL, Gmail scopes, or AI provider secrets.                                     | Passed        |
| Public boundary CI          | `pnpm check:public-boundary`                                                                                               | Public-site imports and routes stay free of app-only Gmail/auth/Prisma/sync code except the docs search route.                                                      | Passed        |

## Commands used during the latest verification

### Local DB and demo

```bash
pnpm db:use sqlite
pnpm db:push
pnpm seed:demo
```

### Temporary Postgres for migrate deploy

```bash
docker run -d --name inboxctrl-osn94-postgres -e POSTGRES_DB=inboxctrl -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 15432:5432 postgres:16-bookworm
docker exec inboxctrl-osn94-postgres pg_isready -U postgres -d inboxctrl
pnpm db:use postgres
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:15432/inboxctrl?schema=public'; pnpm db:migrate:deploy
docker rm -f inboxctrl-osn94-postgres
pnpm db:use sqlite
```

### Docker smokes

```bash
$env:INBOXCTRL_APP_PORT='13000'; docker compose -p inboxctrl-osn92-app up -d --build --wait
Invoke-WebRequest -UseBasicParsing http://localhost:13000/api/health
docker compose -p inboxctrl-osn92-app down -v --remove-orphans

$env:INBOXCTRL_DEMO_PORT='13002'; docker compose -p inboxctrl-osn92-demo -f docker-compose.demo.yml up -d --build --wait
Invoke-WebRequest -UseBasicParsing http://localhost:13002/api/health
docker compose -p inboxctrl-osn92-demo -f docker-compose.demo.yml down -v --remove-orphans

$env:INBOXCTRL_SITE_PORT='13001'; docker compose -p inboxctrl-osn92-site -f docker-compose.site.yml up -d --build --wait
Invoke-WebRequest -UseBasicParsing http://localhost:13001/docs
docker compose -p inboxctrl-osn92-site -f docker-compose.site.yml down -v --remove-orphans
```

## Notes

- On Windows, Prisma client generation can fail with `EPERM ... query_engine-windows.dll.node` if the local dev server is running and holding the generated engine open. Stop the dev server before re-running `pnpm db:push` or other Prisma commands that regenerate the client.
- The product compose file now keeps the bundled Postgres service on the internal Docker network by default.
- The compose files support `INBOXCTRL_APP_PORT`, `INBOXCTRL_DEMO_PORT`, and `INBOXCTRL_SITE_PORT` so smokes can run on machines where `3000` or `3001` are already occupied.
- The `apps/web` health route intentionally returns only:

```json
{
  "ok": true,
  "service": "inboxctrl-web",
  "timestamp": "..."
}
```

- The public site container should remain independent of app secrets. If it starts requiring Google OAuth, Better Auth, Prisma, or Gmail-related env vars, treat that as a launch regression.
