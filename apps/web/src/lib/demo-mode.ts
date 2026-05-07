import { DEMO_ACCESS_TOKEN, DEMO_ACCOUNT_ID, DEMO_EMAIL, DEMO_SCOPES, DEMO_USER_ID } from '@inboxctrl/demo-data';

import type { Account } from '@prisma/client';

export const DEMO_MODE_REAL_GMAIL_BLOCKED = 'DEMO_MODE_REAL_GMAIL_BLOCKED';

export const isDemoMode = () => process.env.INBOXCTRL_DEMO_MODE === 'true';

export const demoUser = {
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  name: 'InboxCtrl Demo',
  image: null,
};

export const createDemoAccount = (): Account => {
  const now = new Date(0);

  return {
    id: DEMO_ACCOUNT_ID,
    userId: DEMO_USER_ID,
    accountId: DEMO_EMAIL,
    providerId: 'google',
    accessToken: DEMO_ACCESS_TOKEN,
    refreshToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: DEMO_SCOPES.join(' '),
    idToken: null,
    password: null,
    createdAt: now,
    updatedAt: now,
  };
};
