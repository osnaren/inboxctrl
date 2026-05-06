# Google OAuth Self-Hosting

Last reviewed: 2026-05-06.

InboxCtrl is designed for user-owned Google OAuth credentials in local and self-hosted installs. Each operator should
create their own Google Cloud project and OAuth client instead of sharing credentials from a public repository.

## Local Client

Create a Google Cloud OAuth client with application type `Web application`.

For local development, add this authorized redirect URI exactly:

```txt
http://localhost:3000/api/auth/callback/google
```

Then set these values in `apps/web/.env`:

```bash
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

Google redirect URI matching is exact, including scheme, host, path, case, and trailing slash.

## Self-Hosted Client

For a deployed instance, set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the public origin, then add the callback URL
for that origin in Google Cloud:

```txt
https://your-domain.example/api/auth/callback/google
```

Use separate Google Cloud projects or OAuth clients for local development, staging, and production when possible. That
keeps testing users, OAuth consent status, and production verification separate.

## Permission Behavior

InboxCtrl currently requests sign-in scopes plus Gmail organizer and settings/filter scopes at Google sign-in:

- `profile`
- `email`
- `gmail.modify`
- `gmail.settings.basic`
- `gmail.labels`

See [Gmail Permission Modes](gmail-permission-modes.md) for the workflow map and verification impact. If Google returns
fewer scopes than a workflow requires, InboxCtrl should report the missing permission and disable that workflow rather
than making a failing Gmail API call.

## Token Handling

Better Auth stores the provider account and token metadata in the local database. Server-side Gmail operations request a
fresh Google access token through Better Auth before constructing a Gmail API client, which lets expired access tokens be
refreshed when a refresh token is available.

Disconnecting a Google account attempts to revoke the Google grant and removes the local provider account, cached mail
metadata, labels, and activity logs for the current single-account user model.

Primary references:

- <https://better-auth.com/docs/concepts/oauth>
- <https://better-auth.com/docs/concepts/api>
- <https://developers.google.com/identity/protocols/oauth2/web-server>
