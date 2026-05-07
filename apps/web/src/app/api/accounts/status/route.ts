import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getGoogleAccountStatus } from '@/lib/accounts';
import { getErrorMessage } from '@/lib/errors';
import { getCurrentUser } from '@/lib/session-user';

export async function GET(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = await getCurrentUser(requestHeaders);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const status = await getGoogleAccountStatus(user, requestHeaders);

    return NextResponse.json(status);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch account status', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
