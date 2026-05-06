import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { DBService } from '@/lib/services/db.service';
import { GmailService } from '@/lib/services/gmail.service';

export async function POST(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = new DBService();
    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
    const gmailService = await GmailService.forUser(session.user.id, requestHeaders);
    if (!gmailService) return NextResponse.json({ error: 'No Google account connected' }, { status: 400 });

    const remoteLabels = await gmailService.listLabels();
    for (const label of remoteLabels) {
      if (!label.id || !label.name) continue;
      await prisma.label.upsert({
        where: { gmailId: label.id },
        update: { name: label.name, type: label.type || 'system', color: label.color?.backgroundColor || null },
        create: {
          gmailId: label.id,
          userId: session.user.id,
          name: label.name,
          type: label.type || 'system',
          color: label.color?.backgroundColor || null,
        },
      });
    }

    const remoteMessages = await gmailService.listRecentMessages(25, ['INBOX']);
    let syncedCount = 0;

    for (const msg of remoteMessages) {
      if (!msg.id) continue;
      if (await db.emailExists(msg.id)) continue;

      const fullMsg = await gmailService.getMessageMetadata(msg.id);
      const extractedHeaders = gmailService.extractHeaders(fullMsg.payload?.headers);

      let parsedDate = new Date();
      if (extractedHeaders.date) {
        const d = new Date(extractedHeaders.date);
        if (!isNaN(d.getTime())) parsedDate = d;
      }

      await prisma.emailMetadata.create({
        data: {
          messageId: fullMsg.id as string,
          threadId: fullMsg.threadId as string,
          userId: session.user.id,
          from: extractedHeaders.from,
          to: extractedHeaders.to,
          subject: extractedHeaders.subject,
          snippet: fullMsg.snippet || '',
          date: parsedDate,
          isUnread: (fullMsg.labelIds || []).includes('UNREAD'),
          isStarred: (fullMsg.labelIds || []).includes('STARRED'),
          labelIds: JSON.stringify(fullMsg.labelIds || []),
        },
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: unknown) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: 'Failed to sync', details: getErrorMessage(error) }, { status: 500 });
  }
}
