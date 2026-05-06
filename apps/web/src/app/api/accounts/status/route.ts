import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getGoogleAccountStatus } from '@/lib/accounts';
import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

export async function GET(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const status = await getGoogleAccountStatus(session.user, requestHeaders);

    return NextResponse.json(status);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch account status', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
