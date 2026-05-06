# Docker

Runtime Docker assets belong here.

The current development app uses SQLite through `apps/web/prisma/schema.prisma`.

`docker-compose.postgres.yml` is optional Postgres scaffolding for deployments that want to move beyond the default local
SQLite database. Update credentials before using it outside local development.
