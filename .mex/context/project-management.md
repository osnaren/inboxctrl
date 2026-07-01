---
name: project-management
description: How this project uses Linear for issue tracking, planning, and status updates. Load when creating, updating, or reviewing issues and project status.
triggers:
  - 'linear'
  - 'issue'
  - 'ticket'
  - 'project status'
  - 'backlog'
  - 'sprint'
  - 'roadmap tracking'
  - 'task management'
  - 'OSL-'
edges:
  - target: context/conventions.md
    condition: when issue work involves code changes
  - target: context/architecture.md
    condition: when scoping an issue requires understanding system boundaries
  - target: patterns/future-roadmap-decisions.md
    condition: when the issue involves product direction or prioritization
last_updated: 2026-06-27
---

# Project Management

## Linear Is the Source of Truth

All InboxCtrl work is tracked in **Linear**.

## Workspace

- **Workspace:** osnaren
- **Team:** osLabs (`OSL`)
- **Project:** InboxCtrl
- **Project URL:** <https://linear.app/osnaren/project/inboxctrl-eb9c34209d5a>

## Issue Lifecycle

| State       | Type      | Meaning                                   |
| ----------- | --------- | ----------------------------------------- |
| Backlog     | backlog   | Not yet started, may be prioritized later |
| Todo        | unstarted | Committed for current or next cycle       |
| In Progress | started   | Actively being worked on                  |
| In Review   | started   | PR open or awaiting review                |
| Done        | completed | Shipped and verified                      |
| Canceled    | canceled  | Won't do                                  |
| Duplicate   | duplicate | Merged into another issue                 |

## Labels

Labels in this project describe the **domain** of work, not priority:

| Label          | Use for                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `Architecture` | Repository structure, package boundaries, long-lived technical architecture |
| `Maintenance`  | Follow-up work keeping a beta project healthy and production-safe           |
| `Testing`      | Automated checks, contract tests, smoke tests, validation matrix            |
| `Bug`          | Defect reports                                                              |
| `Feature`      | New user-facing functionality                                               |
| `Improvement`  | Enhancement to existing functionality                                       |
| `Security`     | Boundary checks, privacy gates, auth isolation                              |
| `SEO`          | Search visibility, metadata, schema, crawlability                           |
| `Analytics`    | Cookie consent, GA, Web Vitals, product measurement                         |
| `Sharing`      | Share link, social sharing, client-side encoded share flows                 |
| `API`          | Public API routes, validation, rate limiting                                |
| `Docs`         | Documentation, README, setup, architecture notes                            |
| `Product`      | Product direction, roadmap, UX decisions                                    |
| `UI`           | Shared UI primitives, shadcn packaging                                      |
| `Later`        | Explicitly deferred work                                                    |

## Creating Issues

When creating a new issue, include:

1. **Title:** concise, action-oriented (e.g., "Fix exposure caching for night-time routes")
2. **Description:** use markdown with `## Problem`, `## Scope`, and `## Exit Criteria` sections
3. **Team:** always `osLabs`
4. **Project:** always `InboxCtrl`
5. **Labels:** pick the relevant domain labels (1–3 typically)
6. **Priority:** `Urgent` (P1) for production-blocking, `High` (P2) for current-cycle, `Medium` (P3) for planned, `Low` (P4) for nice-to-have

## Updating Issues

- When starting work: move to `In Progress`
- When opening a PR: move to `In Review` and add the PR URL as a comment
- When work is verified: move to `Done` and add a completion comment summarizing what was done
- Add comments for significant progress updates, blockers, or decisions made during implementation

## Completion Comments

When closing an issue, add a comment that includes:

- What was changed and why (high-level, not file-by-file)
- Commits involved (if useful for traceability)
- Verification status (typecheck, lint, tests)
- Any known follow-up items or pre-existing issues encountered

## Cycle Tracking

Linear cycles are available per team. Use `mcp_linear_list_cycles` with `teamId` to check current/upcoming cycles when planning work.

## Documents

Linear documents can be used for longer-form planning (roadmaps, architecture decision records, design docs). Use `mcp_linear_list_documents` and `mcp_linear_get_document` to access them.
