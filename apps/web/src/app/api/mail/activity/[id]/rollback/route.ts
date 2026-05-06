import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { GmailService } from '@/lib/services/gmail.service';

export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await props.params;
    if (!id) return NextResponse.json({ error: 'Missing activity ID' }, { status: 400 });

    const log = await prisma.activityLog.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!log) return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    if (log.isRolledBack) return NextResponse.json({ error: 'Already rolled back' }, { status: 400 });
    if (!log.metadata) return NextResponse.json({ error: 'No rollback metadata available' }, { status: 400 });

    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
    const gmailService = await GmailService.forUser(session.user.id, requestHeaders);
    if (!gmailService) return NextResponse.json({ error: 'No Google account connected' }, { status: 400 });

    const rollbackData = JSON.parse(log.metadata);

    if (log.action === 'BULK_LABEL' || log.action === 'BULK_ARCHIVE') {
      const messages = rollbackData.messages || [];
      for (const msg of messages) {
        await gmailService.modifyMessageLabels(msg.messageId, msg.removedLabels, msg.addedLabels);
      }
    } else {
      return NextResponse.json({ error: `Rollback not supported for action ${log.action}` }, { status: 400 });
    }

    const updatedLog = await prisma.activityLog.update({
      where: { id },
      data: { isRolledBack: true },
    });

    return NextResponse.json({ success: true, log: updatedLog });
  } catch (error: unknown) {
    console.error('Rollback Error:', error);
    return NextResponse.json({ error: 'Failed to rollback', details: getErrorMessage(error) }, { status: 500 });
  }
}
