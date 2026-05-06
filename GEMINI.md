# InboxCtrl

## Project Overview

InboxCtrl is an open-source Gmail control plane designed for local inbox cleanup, label synchronization, safe bulk actions, and natural-language filter drafts.

The repository is structured as a monorepo managed with `pnpm`. It features a core public app that functions autonomously, with an extensible architecture that allows loading private/optional plugins via the `INBOXCTRL_PLUGINS` environment variable.

### Directory Structure

- `apps/web/`: The primary Next.js web application.
- `apps/docs/`: Future documentation application.
- `apps/marketing/`: Future marketing application.
- `packages/`: Shared libraries including `core`, `plugin-sdk`, `licensing`, `config`, `ai`, `gmail`, `db`, `sync-engine`, `rule-engine`, and `ui`.

### Technologies

- **Framework:** Next.js
- **Language:** TypeScript
- **Package Manager:** `pnpm`
- **Database / ORM:** Prisma (using SQLite by default for local development)
- **Authentication:** Better Auth (with Google OAuth)
- **AI Providers:** OpenAI, Anthropic (for filter drafts and AI triage)

## Building and Running

Prerequisites: Node.js, `pnpm`, and Google OAuth credentials.

### Environment Setup

1. Copy the `.env.example` file to create an `.env` file in the `apps/web/` directory.
2. Fill in the required credentials including `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and optionally `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`.

### Key Commands

Run these commands from the root of the repository:

- **Install dependencies:**

  ```bash
  corepack enable
  pnpm install
  ```

- **Database Setup (Prisma):**

  ```bash
  pnpm prisma:generate
  pnpm prisma:push
  ```

- **Start Development Server:**

  ```bash
  pnpm dev
  ```

  The app will be available at `http://localhost:3000`.

- **Build for Production:**

  ```bash
  pnpm build
  ```

- **Validation & Code Quality:**

  ```bash
  pnpm typecheck
  pnpm lint
  pnpm format
  ```

## Development Conventions

- **Monorepo Scripts:** Root `package.json` scripts map directly to the Next.js app (`@inboxctrl/web`) via the `--filter` flag, making it easy to run app-specific commands from the root.
- **Code Formatting:** The project uses `prettier` for formatting and `eslint` for linting. A `lint-staged` configuration alongside `husky` ensures code quality on commit.
- **Extension Boundary:** Avoid tight coupling between public and private codebase features. Extensions and private code should be implemented using the `plugin-sdk` and loaded via the `INBOXCTRL_PLUGINS` environment variable, ensuring the core OSS application remains independent.
- **Authentication Flow:** Detailed behavior regarding self-hosting, Google OAuth configuration, and permissions can be found in the `docs/` folder (e.g., `docs/gmail-permission-modes.md` and `docs/google-oauth-self-hosting.md`). Local environments must use the exact redirect URI: `http://localhost:3000/api/auth/callback/google`.
