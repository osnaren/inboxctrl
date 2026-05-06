import { headers } from 'next/headers';

import {
  GMAIL_PERMISSION_MODES,
  GMAIL_SCOPES,
  getCurrentGmailPermissionMode,
  getGrantedGmailPermissionModes,
  getMissingScopesForGmailPermissionMode,
  hasAnyGmailScope,
  normalizeGoogleScopes,
  type GmailPermissionModeId,
} from '@inboxctrl/core';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import type { Account } from '@prisma/client';

export const GOOGLE_PROVIDER_ID = 'google';

type AuthRequestHeaders = Awaited<ReturnType<typeof headers>>;

interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  image?: string | null;
}

export interface GoogleAccessTokenResult {
  accessToken: string;
  accessTokenExpiresAt: Date | null;
  scopes: string[];
  source: 'better-auth' | 'database';
}

const permissionModeOrder: GmailPermissionModeId[] = ['read-only-audit', 'organizer', 'settings-filter'];

const toISOStringOrNull = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  return new Date(date).toISOString();
};

const isPast = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  return new Date(date).getTime() <= Date.now();
};

const getPermissionSummary = (scopes: string | readonly string[] | null | undefined) => {
  const normalizedScopes = normalizeGoogleScopes(scopes);
  const currentPermissionMode = getCurrentGmailPermissionMode(normalizedScopes);
  const grantedPermissionModes = getGrantedGmailPermissionModes(normalizedScopes);

  return {
    currentPermissionMode,
    currentPermissionModeLabel: currentPermissionMode ? GMAIL_PERMISSION_MODES[currentPermissionMode].label : null,
    grantedPermissionModes,
    grantedScopes: normalizedScopes,
    missingScopesByMode: Object.fromEntries(
      permissionModeOrder.map((modeId) => [modeId, getMissingScopesForGmailPermissionMode(modeId, normalizedScopes)])
    ) as Record<GmailPermissionModeId, string[]>,
  };
};

const getCapabilitySummary = (scopes: string | readonly string[] | null | undefined) => ({
  canListLabels: hasAnyGmailScope(scopes, [GMAIL_SCOPES.labels, GMAIL_SCOPES.fullMail]),
  canReadMetadata: hasAnyGmailScope(scopes, [
    GMAIL_SCOPES.metadata,
    GMAIL_SCOPES.readonly,
    GMAIL_SCOPES.modify,
    GMAIL_SCOPES.fullMail,
  ]),
  canOrganizeMail: hasAnyGmailScope(scopes, [GMAIL_SCOPES.modify, GMAIL_SCOPES.fullMail]),
  canManageFilters: hasAnyGmailScope(scopes, [GMAIL_SCOPES.settingsBasic, GMAIL_SCOPES.fullMail]),
});

export async function getConnectedGoogleAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId, providerId: GOOGLE_PROVIDER_ID },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getPrimaryGoogleAccount(userId: string, accountId?: string) {
  return prisma.account.findFirst({
    where: { userId, providerId: GOOGLE_PROVIDER_ID, ...(accountId ? { accountId } : {}) },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getGoogleAccessTokenForAccount(
  userId: string,
  requestHeaders: AuthRequestHeaders,
  account?: Account | null
): Promise<GoogleAccessTokenResult | null> {
  const googleAccount = account ?? (await getPrimaryGoogleAccount(userId));
  if (!googleAccount) return null;

  try {
    const token = await auth.api.getAccessToken({
      body: {
        providerId: GOOGLE_PROVIDER_ID,
        accountId: googleAccount.accountId,
        userId,
      },
      headers: requestHeaders,
    });

    if (token.accessToken) {
      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt ?? null,
        scopes: normalizeGoogleScopes(token.scopes?.length ? token.scopes : googleAccount.scope),
        source: 'better-auth',
      };
    }
  } catch {
    // Fall back to the stored account record so existing local sessions can still report useful status.
  }

  if (!googleAccount.accessToken) return null;

  return {
    accessToken: googleAccount.accessToken,
    accessTokenExpiresAt: googleAccount.accessTokenExpiresAt ?? null,
    scopes: normalizeGoogleScopes(googleAccount.scope),
    source: 'database',
  };
}

export function serializeGoogleAccount(account: Account, refreshedToken?: GoogleAccessTokenResult | null) {
  const scopes = refreshedToken?.scopes.length ? refreshedToken.scopes : normalizeGoogleScopes(account.scope);

  return {
    id: account.id,
    providerId: account.providerId,
    accountId: account.accountId,
    connectedAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    hasAccessToken: Boolean(refreshedToken?.accessToken ?? account.accessToken),
    hasRefreshToken: Boolean(account.refreshToken),
    accessTokenExpiresAt: toISOStringOrNull(refreshedToken?.accessTokenExpiresAt ?? account.accessTokenExpiresAt),
    refreshTokenExpiresAt: toISOStringOrNull(account.refreshTokenExpiresAt),
    accessTokenExpired: isPast(refreshedToken?.accessTokenExpiresAt ?? account.accessTokenExpiresAt),
    refreshTokenExpired: isPast(account.refreshTokenExpiresAt),
    scopes,
    permission: getPermissionSummary(scopes),
    capabilities: getCapabilitySummary(scopes),
  };
}

export async function getGoogleAccountStatus(user: SessionUser, requestHeaders: AuthRequestHeaders) {
  const accounts = await getConnectedGoogleAccounts(user.id);
  const primaryAccount = accounts[0] ?? null;
  const refreshedToken = primaryAccount
    ? await getGoogleAccessTokenForAccount(user.id, requestHeaders, primaryAccount)
    : null;
  const serializedAccounts = accounts.map((account) =>
    serializeGoogleAccount(account, account.id === primaryAccount?.id ? refreshedToken : null)
  );
  const primary = serializedAccounts[0] ?? null;
  const tokenReady = Boolean(refreshedToken?.accessToken);
  const syncReady = Boolean(primary?.capabilities.canListLabels && primary.capabilities.canReadMetadata && tokenReady);

  return {
    connected: Boolean(primary),
    connectedEmail: user.email,
    syncReady,
    tokenReady,
    tokenSource: refreshedToken?.source ?? null,
    account: primary,
    accounts: serializedAccounts,
    requiredPermissionLevel: 'Read-only audit',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  };
}

export async function revokeGoogleOAuthToken(token: string) {
  const response = await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  });

  return {
    attempted: true,
    ok: response.ok,
    status: response.status,
  };
}
