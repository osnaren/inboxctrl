# Docker

Runtime Docker assets belong here.

Use the root Compose files for the current launch-foundation paths:

- `docker-compose.yml` for the product app plus Postgres
- `docker-compose.demo.yml` for seeded demo mode with the SQLite profile
- `docker-compose.site.yml` for the public site only

Run the product app with your existing app env file:

```bash
docker compose --env-file apps/web/.env up --build
```

The product app compose file expects real `BETTER_AUTH_SECRET`, `INBOXCTRL_SECRET`, Google OAuth credentials, and the
correct public app URLs in that env file. The bundled Postgres service stays on the internal Docker network by default,
so add a host port mapping only if you explicitly need direct local database access. Override `INBOXCTRL_APP_PORT`,
`INBOXCTRL_DEMO_PORT`, or `INBOXCTRL_SITE_PORT` when the default web ports are already taken. Demo mode and the public
site can boot with their tracked defaults.
