import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { DBService } from '@/lib/services/db.service';
import { GmailService } from '@/lib/services/gmail.service';
import { getCurrentUser } from '@/lib/session-user';

export async function POST(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = await getCurrentUser(requestHeaders);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = new DBService();
    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'read-only-audit');
    if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

    const gmailService = new GmailService(permission.accessToken);
    const remoteLabels = await gmailService.listLabels();
    for (const label of remoteLabels) {
      if (!label.id || !label.name) continue;
      await prisma.label.upsert({
        where: { gmailId: label.id },
        update: { name: label.name, type: label.type || 'system', color: label.color || null },
        create: {
          gmailId: label.id,
          userId: user.id,
          name: label.name,
          type: label.type || 'system',
          color: label.color || null,
        },
      });
    }

    const remoteMessages = await gmailService.listRecentMessages(25, ['INBOX']);
    let syncedCount = 0;

    for (const msg of remoteMessages) {
      if (!msg.id) continue;
      if (await db.emailExists(msg.id)) continue;

      const fullMsg = await gmailService.getMessageMetadata(msg.id);
      const extractedHeaders = fullMsg.headers;

      let parsedDate = new Date();
      if (extractedHeaders.date) {
        const d = new Date(extractedHeaders.date);
        if (!isNaN(d.getTime())) parsedDate = d;
      }

      const sender = extractSenderEmail(extractedHeaders.from);

      await prisma.emailMetadata.create({
        data: {
          messageId: fullMsg.id as string,
          threadId: fullMsg.threadId as string,
          userId: user.id,
          from: extractedHeaders.from,
          to: extractedHeaders.to,
          subject: extractedHeaders.subject,
          snippet: fullMsg.snippet || '',
          sender,
          date: parsedDate,
          isUnread: (fullMsg.labelIds || []).includes('UNREAD'),
          isStarred: (fullMsg.labelIds || []).includes('STARRED'),
          labelIds: JSON.stringify(fullMsg.labelIds || []),
        },
      });
      syncedCount++;
    }

    // Update last sync timestamp for cache freshness
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: unknown) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: 'Failed to sync', details: getErrorMessage(error) }, { status: 500 });
  }
}

function extractSenderEmail(fromHeader: string): string {
  const senderMatch = fromHeader.match(/<([^>]+)>/);
  return (senderMatch ? senderMatch[1] : fromHeader).toLowerCase().trim();
}
