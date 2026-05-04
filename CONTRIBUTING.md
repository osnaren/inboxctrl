# CONTRIBUTING

We welcome contributions to InboxCtrl!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/inboxctrl.git`
3. Enable package manager shims: `corepack enable`
4. Install dependencies: `pnpm install`
5. Set up `apps/web/.env` from `apps/web/.env.example`
6. Generate Prisma client: `pnpm prisma:generate`
7. Prepare the local database: `pnpm prisma:push`
8. Start development server: `pnpm dev`

## Pull Requests

- Keep PRs focused on a single feature or bugfix.
- Follow the existing code style (we use Prettier and ESLint).
- Ensure checks pass before opening a PR: `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
