import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { getGoogleAccountStatus } from '@/lib/accounts';
import { handleApiRouteError, jsonApiSuccess, requireAuthenticatedUser } from '@/lib/api/contracts';
import { getCurrentUser } from '@/lib/session-user';

export async function GET(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));

    const status = await getGoogleAccountStatus(user, requestHeaders);

    return jsonApiSuccess(status);
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'ACCOUNT_STATUS_FETCH_FAILED',
      message: 'Failed to fetch account status',
    });
  }
}
