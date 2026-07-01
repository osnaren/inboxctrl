---
name: git-workflow
description: Git commit conventions, branch strategy, and workflow rules for this project. Load when committing code, creating branches, or preparing PRs.
triggers:
  - 'commit'
  - 'git'
  - 'branch'
  - 'pull request'
  - 'PR'
  - 'merge'
  - 'husky'
  - 'lint-staged'
edges:
  - target: context/conventions.md
    condition: when the commit involves code style or structural decisions
  - target: context/project-management.md
    condition: when linking commits to Linear issues
last_updated: 2026-06-27
---

# Git Workflow

## Commit Format

Use **conventional commits** with this structure:

```
<type>: <emoji> <short description>

- <what changed and why — significant changes only>
- <avoid file names, do not explain how>
```

### Types

| Type       | Emoji | Use for                                    |
| ---------- | ----- | ------------------------------------------ |
| `feat`     | ✨    | New user-facing functionality              |
| `fix`      | 🐛    | Bug fixes                                  |
| `docs`     | 📝    | Documentation only                         |
| `style`    | 💄    | Formatting, whitespace, no code change     |
| `refactor` | ♻️    | Code restructuring without behavior change |
| `test`     | ✅    | Adding or updating tests                   |
| `chore`    | 🔧    | Tooling, deps, config, CI                  |
| `perf`     | ⚡    | Performance improvements                   |
| `ci`       | 👷    | CI/CD pipeline changes                     |
| `build`    | 📦    | Build system or external dependencies      |

### Rules

- Short description under 50 characters, imperative mood.
- Concise and informal — no filler phrases like "this commit" or "this change".
- Don't mention specific file names in the subject line.
- Body explains **what** changed and **why**, not **how**.
- Add a newline after the subject line before the body.

### Examples

```
refactor: ♻️ co-locate test files next to source modules

- Move all 21 test files from root __tests__/ into sibling dirs
- Fix broken relative imports to use path aliases
- Update pnpm script patterns for focused test suites
```

```
fix: 🐛 gate /api/test endpoint behind NODE_ENV

- Return 404 in production instead of exposing diagnostic endpoint
```

```
docs: 📝 update .mex docs to reflect codebase restructure

- Update all path references in context and pattern files
- Bump last_updated dates
```

## Pre-commit Hooks

Husky runs `lint-staged` on pre-commit. The staged-file configuration processes:

- `*.{js,jsx,ts,tsx,mjs,cjs}` → ESLint auto-fix, then Prettier
- `*.{json,md,css,scss,html,yml,yaml}` → Prettier

If the pre-commit hook fails, fix the reported issues before committing.

## Branch Strategy

- **`main`** is the default and production branch. All work commits directly to `main` for this project.
- **Linear-generated branch names** follow the pattern `feature/osl-<number>` (e.g., `feature/osl-202`). These are optional — direct commits to `main` are acceptable for small tasks.
- When using a feature branch, squash or rebase before merging to keep `main` history clean.

## Commit Granularity

- Each logical unit of work gets its own commit. Don't batch unrelated changes.
- Stage and commit after each step when doing multi-step refactors.
- Run `pnpm run typecheck` and `pnpm test` before committing to ensure no regressions.
- For large refactors, verify each commit individually so `git bisect` remains useful.

## Linking to Linear

When a commit addresses a Linear issue:

- Reference the issue ID in the commit body (e.g., `Closes OSL-202`)
- Add a completion comment on the Linear issue with what changed and verification status
- Move the issue to `Done` once verified

## What NOT to Commit

- `.env.local` — contains local secrets and is gitignored
- `node_modules/` — managed by pnpm lockfile
- `.next/` — build output
- Generated `coverage/` reports
