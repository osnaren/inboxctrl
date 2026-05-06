import { headers } from 'next/headers';

import {
  getCurrentGmailPermissionMode,
  getScopesWithSignInForPermissionMode,
  GMAIL_PERMISSION_MODES,
  type GmailPermissionModeId,
} from '@inboxctrl/core';

import { getGoogleAccessTokenForAccount, getPrimaryGoogleAccount } from '@/lib/accounts';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mode = body.mode as GmailPermissionModeId;

  const requestHeaders = await headers();

  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validModes: GmailPermissionModeId[] = ['read-only-audit', 'organizer', 'settings-filter'];
  if (!validModes.includes(mode)) {
    return Response.json(
      {
        error: 'Invalid permission mode',
        validModes,
      },
      { status: 400 }
    );
  }

  const account = await getPrimaryGoogleAccount(session.user.id);
  if (!account) {
    return Response.json(
      {
        error: 'No Google account connected',
        action: 'connect',
      },
      { status: 400 }
    );
  }

  const token = await getGoogleAccessTokenForAccount(session.user.id, requestHeaders, account);
  if (!token) {
    return Response.json(
      {
        error: 'No access token available',
        action: 'reconnect',
      },
      { status: 400 }
    );
  }

  const currentMode = getCurrentGmailPermissionMode(token.scopes);
  const modeInfo = GMAIL_PERMISSION_MODES[mode];
  const targetScopes = getScopesWithSignInForPermissionMode(mode);

  return Response.json({
    accountConnected: true,
    currentMode,
    currentModeLabel: currentMode ? GMAIL_PERMISSION_MODES[currentMode].label : null,
    requestedMode: mode,
    requestedModeLabel: modeInfo.label,
    scopes: targetScopes,
    upgradeUrl: buildUpgradeUrl(targetScopes),
  });
}

function buildUpgradeUrl(scopes: readonly (GmailPermissionModeId | string)[]): string {
  const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const scopeString = scopes.join(' ');

  const params = new URLSearchParams({
    prompt: 'consent',
    access_type: 'offline',
    include_granted_scopes: 'true',
    scope: scopeString,
    response_type: 'code',
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: `${baseUrl}/api/auth/callback/google`,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
