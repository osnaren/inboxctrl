# AGENTS.md

## Repo Root

- The git repo root is this `inboxctrl/` directory; the parent workspace may also contain `inboxctrl-pro/`, which is not part of this repo.
- `AGENTS.md` and `CLAUDE.md` are listed in `.gitignore`, so edits to this file may not appear in `git status` unless forced.

## Commands

- Use pnpm via `corepack enable`; the root manifest pins `pnpm@10.33.0`.
- First local setup: copy `apps/web/.env.example` to `apps/web/.env`, then run `pnpm install`, `pnpm prisma:generate`, `pnpm prisma:push`, `pnpm dev`.
- Standard validation from the repo root: `pnpm typecheck`, `pnpm lint`, `pnpm build`.
- Focused checks: `pnpm --filter @inboxctrl/web typecheck`, `pnpm --filter @inboxctrl/web lint`, `pnpm --filter @inboxctrl/<package> typecheck`, or `pnpm --filter @inboxctrl/web exec eslint <file> --max-warnings=0`.
- There is no test script, test config, or GitHub Actions workflow right now; do not assume `pnpm test` exists.
- The Husky pre-commit hook only runs `lint-staged` ESLint/Prettier on staged files; it does not run typecheck or build.

## Workspace Shape

- Workspaces are `apps/*` and `packages/*`; only `apps/web` is a runnable app today. `apps/docs` and `apps/marketing` are placeholders.
- Root `dev`, `build`, `start`, `lint`, and Prisma scripts all delegate to `@inboxctrl/web` with pnpm filters.
- Shared packages export TypeScript source from `src/index.ts`; `apps/web/next.config.ts` transpiles all `@inboxctrl/*` packages.
- Package builds are declaration-only via `tsc -b`; generated `packages/*/dist` and `*.tsbuildinfo` are ignored.
- The `@/*` path alias is only configured inside `apps/web`; package code should import other packages by their `@inboxctrl/*` names.

## Web App

- `apps/web` is a Next 16 App Router app with React 19; API routes live under `apps/web/src/app/api`.
- Better Auth is wired in `apps/web/src/lib/auth.ts`; the catch-all route is `apps/web/src/app/api/auth/[...all]/route.ts`; browser auth uses `apps/web/src/lib/auth-client.ts`.
- Tailwind v4 is configured through `apps/web/src/app/globals.css`, not a `tailwind.config.*` file; shadcn uses `apps/web/components.json` with `base-nova` style and `@/components/ui` aliases.

## Data And Env

- Use `apps/web/.env.example` as the env reference; never rely on or expose the ignored local `apps/web/.env`.
- Prisma schema source is `apps/web/prisma/schema.prisma`; run `pnpm prisma:generate` after schema changes and `pnpm prisma:push` to update the local DB.
- The Prisma datasource is currently hardcoded to SQLite `file:./dev.db` in the schema, so changing `DATABASE_URL` alone does not move the DB.
- Local Google OAuth must use the exact redirect URI `http://localhost:3000/api/auth/callback/google`; deployed origins use `${BETTER_AUTH_URL}/api/auth/callback/google`.

## Gmail, Privacy, Extensions

- Gmail permission source of truth is `packages/core/src/gmail-permissions.ts`; keep docs in `docs/gmail-permission-modes.md` aligned with that file.
- Do not request `https://mail.google.com/` for the OSS app; current workflows use narrower Gmail scopes.
- Gmail-mutating API routes should gate access through `requireGoogleAccountPermission` in `apps/web/src/lib/accounts.ts` before calling Gmail.
- The privacy model is metadata/snippet cache by default; full email bodies and AI outputs should stay transient unless a user explicitly saves/applies something.
- Keep the OSS app independent of private extensions. Optional plugins are comma-separated in `INBOXCTRL_PLUGINS`, parsed by `@inboxctrl/config`, and loaded in `apps/web/src/plugin-loader/registry.ts`.

## Project Management

Linear is the active source of truth for all InboxCtrl work. Team: **osLabs**, Project: **InboxCtrl**. See `.mex/context/project-management.md` for workflow, labels, statuses, and issue conventions. GitHub Issues are archived records only.

## Git Conventions

Use conventional commits: `<type>: <emoji> <short description>`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`. See `.mex/context/git-workflow.md` for full rules and examples. Husky runs lint-staged on pre-commit.

## After Every Task

After completing any task: update `.mex/ROUTER.md` project state and any `.mex/` files that are now out of date. If no pattern existed for the task you just completed, create one in `.mex/patterns/`.

## Navigation

At the start of every session, read `.mex/ROUTER.md` before doing anything else.
For full project context, patterns, and task guidance — everything is there.
