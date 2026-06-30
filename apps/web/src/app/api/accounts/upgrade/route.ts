import { headers } from 'next/headers';

import {
  getCurrentGmailPermissionMode,
  getScopesWithSignInForPermissionMode,
  GMAIL_PERMISSION_MODES,
  type GmailPermissionModeId,
} from '@inboxctrl/core';

import { getGoogleAccessTokenForAccount, getPrimaryGoogleAccount } from '@/lib/accounts';
import { apiError, handleApiRouteError, jsonApiSuccess, requireAuthenticatedUser } from '@/lib/api/contracts';
import { parseJsonObject, parsePermissionUpgradeRequest } from '@/lib/api/launch-contracts';
import { isDemoMode } from '@/lib/demo-mode';
import { getCurrentUser } from '@/lib/session-user';

export async function POST(request: Request) {
  try {
    const body = await parseJsonObject(request);
    const { mode } = parsePermissionUpgradeRequest(body);
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));

    if (isDemoMode()) {
      return jsonApiSuccess({
        accountConnected: true,
        currentMode: mode,
        currentModeLabel: GMAIL_PERMISSION_MODES[mode].label,
        requestedMode: mode,
        requestedModeLabel: GMAIL_PERMISSION_MODES[mode].label,
        scopes: getScopesWithSignInForPermissionMode(mode),
        upgradeUrl: null,
        demoMode: true,
      });
    }

    const account = await getPrimaryGoogleAccount(user.id);
    if (!account) {
      throw apiError(400, 'GOOGLE_ACCOUNT_REQUIRED', 'No Google account connected', {
        action: 'connect',
      });
    }

    const token = await getGoogleAccessTokenForAccount(user.id, requestHeaders, account);
    if (!token) {
      throw apiError(400, 'GOOGLE_ACCOUNT_TOKEN_REQUIRED', 'No access token available', {
        action: 'reconnect',
      });
    }

    const currentMode = getCurrentGmailPermissionMode(token.scopes);
    const modeInfo = GMAIL_PERMISSION_MODES[mode];
    const targetScopes = getScopesWithSignInForPermissionMode(mode);

    return jsonApiSuccess({
      accountConnected: true,
      currentMode,
      currentModeLabel: currentMode ? GMAIL_PERMISSION_MODES[currentMode].label : null,
      requestedMode: mode,
      requestedModeLabel: modeInfo.label,
      scopes: targetScopes,
      upgradeUrl: buildUpgradeUrl(targetScopes),
    });
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'ACCOUNT_UPGRADE_PREP_FAILED',
      message: 'Failed to prepare Gmail permission upgrade',
    });
  }
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
