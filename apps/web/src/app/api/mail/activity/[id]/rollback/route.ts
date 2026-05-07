import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { ActionEngine } from '@/lib/services/action-engine';
import { GmailService } from '@/lib/services/gmail.service';
import { getCurrentUser } from '@/lib/session-user';

export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const requestHeaders = await headers();
    const user = await getCurrentUser(requestHeaders);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await props.params;
    if (!id) return NextResponse.json({ error: 'Missing activity ID' }, { status: 400 });

    const log = await prisma.activityLog.findFirst({
      where: { id, userId: user.id },
    });

    if (!log) return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    if (log.isRolledBack) return NextResponse.json({ error: 'Already rolled back' }, { status: 400 });
    if (!log.metadata) return NextResponse.json({ error: 'No rollback metadata available' }, { status: 400 });

    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'organizer');
    if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

    const gmailService = new GmailService(permission.accessToken);
    const engine = new ActionEngine(gmailService, user.id);
    const rollback = await engine.rollback(id);
    const updatedLog = await prisma.activityLog.findUnique({ where: { id } });

    return NextResponse.json({ success: rollback.success, reversedCount: rollback.reversedCount, log: updatedLog });
  } catch (error: unknown) {
    console.error('Rollback Error:', error);
    return NextResponse.json({ error: 'Failed to rollback', details: getErrorMessage(error) }, { status: 500 });
  }
}
