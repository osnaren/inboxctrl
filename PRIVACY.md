# PRIVACY POLICY

## What data we collect

InboxCtrl syncs and locally caches the data needed to show and organize your mailbox:

- Email metadata: sender, recipient, subject, date, Gmail message/thread IDs, label IDs, snippets, and read/starred state.
- Label information: name, Gmail ID, type, and color when available.
- Activity history for actions taken through InboxCtrl.

Full email bodies and attachments are not stored in the local database by default.

## AI Processing

When you trigger an AI feature, InboxCtrl sends only the relevant prompt data to the AI provider configured in your environment. Current flows use cached metadata/snippets by default. Features that need full body text should fetch it on demand and avoid persisting it unless the user explicitly saves an output.

## Open Source and Self-Hosting

Because InboxCtrl is open source, you can self-host the application and use your own Google OAuth and AI provider credentials. Your deployment controls where the database, secrets, and provider calls live.
