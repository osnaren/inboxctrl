---
name: router
description: Session bootstrap and navigation hub. Read at the start of every session before any task. Contains project state, routing table, and behavioural contract.
edges:
  - target: context/architecture.md
    condition: when working on system design, integrations, or understanding how components connect
  - target: context/stack.md
    condition: when working with specific technologies, libraries, or making tech decisions
  - target: context/conventions.md
    condition: when writing new code, reviewing code, or unsure about project patterns
  - target: context/decisions.md
    condition: when making architectural choices or understanding why something is built a certain way
  - target: context/setup.md
    condition: when setting up the dev environment or running the project for the first time
  - target: context/gmail-sync.md
    condition: when working on Gmail integration, sync engine, demo mode, or permission model
  - target: context/project-management.md
    condition: when creating, updating, or reviewing Linear issues or project status
  - target: context/git-workflow.md
    condition: when committing code, creating branches, or preparing PRs
  - target: patterns/INDEX.md
    condition: when starting a task — check the pattern index for a matching pattern file
last_updated: 2026-07-01
---

# Session Bootstrap

If you haven't already read `AGENTS.md`, read it now — it contains the project identity, non-negotiables, and commands.

Then read this file fully before doing anything else in this session.

## Current Project State

**Working:**

- Gmail OAuth with three-tier permission model (read-only-audit, organizer, settings-filter)
- Label sync and metadata sync from Gmail to local DB
- Email metadata list view with label filtering
- Bulk actions (label, archive, trash, star/unstar, mark read/unread) with rollback
- Filter CRUD — create, list, delete Gmail filters
- AI-powered natural language to filter conversion
- AI email triage (label suggestions)
- AI summarization, smart replies, task extraction
- Demo mode with deterministic fixtures — no Gmail or AI keys needed
- Dual database support (SQLite for dev, Postgres for Docker self-host)
- Plugin/extension SDK with feature gating and licensing
- Public docs site (apps/site) with deployment guides for Docker, Railway, Render, Fly.io, VPS, and complete responsive light/dark theme compatibility.
- API contract layer with uniform error envelope

**Not yet built:**

- Hosted SaaS or multi-tenant infrastructure
- Background job queue or worker service
- Real-time/websocket updates
- File storage or email attachment handling
- Analytics or telemetry
- Desktop/Tauri packaging
- Platform-specific deployment templates beyond Docker

**Known issues:**

- Older API routes (ai/triage, accounts) use raw `NextResponse.json()` instead of the contract layer — should be migrated
- Environment variables are accessed directly via `process.env` with `as string` casts — no centralized validation
- No migration files exist — `prisma db push` is the default path, which is destructive for data on schema changes

## Routing Table

Load the relevant file based on the current task. Always load `context/architecture.md` first if not already in context this session.

| Task type                            | Load                                             |
| ------------------------------------ | ------------------------------------------------ |
| Understanding how the system works   | `context/architecture.md`                        |
| Working with a specific technology   | `context/stack.md`                               |
| Writing or reviewing code            | `context/conventions.md`                         |
| Making a design decision             | `context/decisions.md`                           |
| Setting up or running the project    | `context/setup.md`                               |
| Working on Gmail, sync, or demo mode | `context/gmail-sync.md`                          |
| Any specific task                    | Check `patterns/INDEX.md` for a matching pattern |

## Behavioural Contract

For every task, follow this loop:

1. **CONTEXT** — Load the relevant context file(s) from the routing table above. Check `patterns/INDEX.md` for a matching pattern. If one exists, follow it. Narrate what you load: "Loading architecture context..."
2. **BUILD** — Do the work. If a pattern exists, follow its Steps. If you are about to deviate from an established pattern, say so before writing any code — state the deviation and why.
3. **VERIFY** — Load `context/conventions.md` and run the Verify Checklist item by item. State each item and whether the output passes. Do not summarise — enumerate explicitly.
4. **DEBUG** — If verification fails or something breaks, check `patterns/INDEX.md` for a debug pattern. Follow it. Fix the issue and re-run VERIFY.
5. **GROW** — After meaningful work, run this binary checklist:
   - **Ground:** What changed in reality? Name the changed behavior, system, command, dependency, or workflow.
   - **Record:** If project state changed, update the "Current Project State" section above. If documented facts changed, update the relevant `context/` file surgically.
   - **Orient:** If this task can recur and no pattern exists, create one in `patterns/` using `patterns/README.md`, then add it to `patterns/INDEX.md`. If a pattern exists but you learned a gotcha, update it.
   - **Write:** Bump `last_updated` in every scaffold file you changed. If the why matters, run `mex log --type decision "<what changed and why>"` or `mex log "<note>"`.
