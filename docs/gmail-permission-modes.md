# Gmail Permission Modes

Last reviewed: 2026-05-06.

InboxCtrl keeps Gmail access grouped into explicit modes so the app can ask for the least access needed for a workflow.
The source of truth lives in `packages/core/src/gmail-permissions.ts`.

## Modes

| Mode                 | Purpose                                                                                                 | Minimum Gmail scopes                   | Verification impact                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Read-only audit      | Inspect mailbox structure, cached metadata, labels, and dry-run results without Gmail mutations.        | `gmail.metadata`, `gmail.labels`       | `gmail.metadata` is restricted; `gmail.labels` is non-sensitive.       |
| Organizer            | Apply review-first mailbox actions such as label changes, archive, read/unread, star/unstar, and trash. | `gmail.modify`, `gmail.labels`         | `gmail.modify` is restricted; `gmail.labels` is non-sensitive.         |
| Settings and filters | Create/delete Gmail filters and manage labels after review.                                             | `gmail.settings.basic`, `gmail.labels` | `gmail.settings.basic` is restricted; `gmail.labels` is non-sensitive. |

InboxCtrl should not request `https://mail.google.com/` for the OSS app. Current workflows do not need full mailbox
access or permanent deletion.

## Workflow Scope Map

| Workflow                                 | Minimum scope                           | Mode                                      |
| ---------------------------------------- | --------------------------------------- | ----------------------------------------- |
| Google sign-in                           | `profile`, `email`                      | Local auth                                |
| Account status and token health          | Local Better Auth account/session state | Local auth                                |
| Label sync                               | `gmail.labels`                          | Read-only audit                           |
| Label create/update/delete               | `gmail.labels`                          | Settings and filters                      |
| Message metadata sync                    | `gmail.metadata`                        | Read-only audit                           |
| Cached mailbox views and local search    | `gmail.metadata`                        | Read-only audit                           |
| Apply/remove labels on messages          | `gmail.modify`                          | Organizer                                 |
| Archive, read/unread, star/unstar, trash | `gmail.modify`                          | Organizer                                 |
| Filter draft and dry-run preview         | `gmail.metadata`                        | Read-only audit                           |
| Create/delete Gmail filters              | `gmail.settings.basic`                  | Settings and filters                      |
| AI label suggestions                     | `gmail.metadata`                        | Read-only audit                           |
| On-demand summary or reply draft         | `gmail.readonly`                        | Read-only audit with explicit body access |
| Disconnect account                       | Local OAuth/account state               | Local auth                                |

## Current Auth Request

The current Better Auth Google provider requests:

- `profile`
- `email`
- `gmail.modify`
- `gmail.settings.basic`
- `gmail.labels`

That means the current implementation combines organizer mode and settings/filter mode at sign-in. It does not yet offer
a separate read-only audit consent path. OSN-63 should enforce route and UI boundaries against the mode map before
mutating actions depend on the current combined request.

## Google Verification Notes

Google classifies `gmail.labels` as non-sensitive. Google classifies `gmail.metadata`, `gmail.readonly`,
`gmail.modify`, and `gmail.settings.basic` as restricted Gmail scopes.

Production apps that request restricted scopes generally need restricted-scope verification. If restricted-scope data is
stored on servers or transmitted, Google may require a security assessment. Development or testing projects can use
Google's testing flow, but users should expect unverified-app warnings until production verification is complete.

Primary references:

- <https://developers.google.com/workspace/gmail/api/auth/scopes>
- <https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification>
- <https://support.google.com/cloud/answer/13463073>
