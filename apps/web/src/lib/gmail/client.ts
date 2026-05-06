import { google, type gmail_v1 } from 'googleapis';

/**
 * Creates an authenticated Gmail API client using a stored access token.
 *
 * Note: In a production app, you must handle token refresh.
 * Better Auth provides ways to access the current session's access token
 * or you can retrieve it directly from the database's Account table.
 */
export async function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return google.gmail({ version: 'v1', auth });
}

/**
 * Parses headers from the Gmail API response to extract From, To, Subject, Date.
 */
export function extractHeaders(headers?: gmail_v1.Schema$MessagePartHeader[]) {
  const result = {
    from: '',
    to: '',
    subject: '',
    date: '',
  };

  if (!headers) return result;

  for (const header of headers) {
    const name = header.name?.toLowerCase();
    if (name === 'from') result.from = header.value || '';
    if (name === 'to') result.to = header.value || '';
    if (name === 'subject') result.subject = header.value || '';
    if (name === 'date') result.date = header.value || '';
  }

  return result;
}
