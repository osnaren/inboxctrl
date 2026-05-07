import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
  getGoogleAccessTokenForAccount,
  getPrimaryGoogleAccount,
  revokeGoogleOAuthToken,
  serializeGoogleAccount,
} from '@/lib/accounts';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session-user';

interface DisconnectRequestBody {
  accountId?: string;
  revokeGoogleGrant?: boolean;
}

const readDisconnectBody = async (req: NextRequest): Promise<DisconnectRequestBody> => {
  try {
    return (await req.json()) as DisconnectRequestBody;
  } catch {
    return {};
  }
};

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = await getCurrentUser(requestHeaders);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await readDisconnectBody(req);
    const account = await getPrimaryGoogleAccount(user.id, body.accountId);
    if (!account) return NextResponse.json({ error: 'No Google account connected' }, { status: 404 });

    const token = await getGoogleAccessTokenForAccount(user.id, requestHeaders, account);
    const revocation =
      body.revokeGoogleGrant === false || !token?.accessToken
        ? { attempted: false, ok: null, status: null }
        : await revokeGoogleOAuthToken(token.accessToken);

    const [deletedEmails, deletedLabels, deletedActivityLogs, deletedAccounts] = await prisma.$transaction([
      prisma.emailMetadata.deleteMany({ where: { userId: user.id } }),
      prisma.label.deleteMany({ where: { userId: user.id } }),
      prisma.activityLog.deleteMany({ where: { userId: user.id } }),
      prisma.account.deleteMany({ where: { id: account.id, userId: user.id } }),
    ]);

    return NextResponse.json({
      disconnected: deletedAccounts.count > 0,
      account: serializeGoogleAccount(account, token),
      revocation,
      removedLocalState: {
        accounts: deletedAccounts.count,
        emails: deletedEmails.count,
        labels: deletedLabels.count,
        activityLogs: deletedActivityLogs.count,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to disconnect account', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
