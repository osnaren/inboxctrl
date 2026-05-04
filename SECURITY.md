# SECURITY

## Reporting a Vulnerability

If you discover a security vulnerability in InboxCtrl, please report it privately to the maintainers. Do not open a public issue for active vulnerabilities.

## Security Practices

- **Secrets**: Keep `.env` files, OAuth credentials, provider keys, and local databases out of git.
- **Token Storage**: OAuth tokens are stored in the configured application database. Production deployments should use encrypted storage and managed secret handling appropriate for their environment.
- **Local Caching**: InboxCtrl caches mailbox metadata and snippets locally. Full email bodies are not stored by default.
- **Gmail Scopes**: InboxCtrl requests only the Gmail scopes needed for its current workflows.
- **Action Logging**: Supported bulk actions write activity records so users can inspect what changed.
