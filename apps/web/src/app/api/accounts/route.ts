import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getConnectedGoogleAccounts, getGoogleAccessTokenForAccount, serializeGoogleAccount } from '@/lib/accounts';
import { getErrorMessage } from '@/lib/errors';
import { getCurrentUser } from '@/lib/session-user';

export async function GET(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = await getCurrentUser(requestHeaders);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await getConnectedGoogleAccounts(user.id);
    const accountSummaries = await Promise.all(
      accounts.map(async (account) => {
        const token = await getGoogleAccessTokenForAccount(user.id, requestHeaders, account);
        return serializeGoogleAccount(account, token);
      })
    );

    return NextResponse.json({ accounts: accountSummaries });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch connected accounts', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
