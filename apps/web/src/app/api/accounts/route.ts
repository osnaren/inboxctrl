import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getConnectedGoogleAccounts, getGoogleAccessTokenForAccount, serializeGoogleAccount } from '@/lib/accounts';
import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await getConnectedGoogleAccounts(session.user.id);
    const accountSummaries = await Promise.all(
      accounts.map(async (account) => {
        const token = await getGoogleAccessTokenForAccount(session.user.id, requestHeaders, account);
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
