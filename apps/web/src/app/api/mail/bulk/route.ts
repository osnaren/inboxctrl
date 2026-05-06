import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { GmailService } from '@/lib/services/gmail.service';

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageIds, action, labelId } = await req.json();
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid messageIds array' }, { status: 400 });
    }

    if (!['archive', 'trash', 'mark-read', 'mark-unread', 'label'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'archive', 'trash', 'mark-read', 'mark-unread', or 'label'" },
        { status: 400 }
      );
    }

    if (action === 'label' && !labelId) {
      return NextResponse.json({ error: "Missing labelId for 'label' action" }, { status: 400 });
    }

    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
    const gmailService = await GmailService.forUser(session.user.id, requestHeaders);
    if (!gmailService) return NextResponse.json({ error: 'No Google account connected' }, { status: 400 });

    // Validate that all messageIds belong to the current user
    const userEmails = await prisma.emailMetadata.findMany({
      where: {
        userId: session.user.id,
        messageId: { in: messageIds },
      },
      select: { messageId: true },
    });

    const validMessageIds = userEmails.map((e) => e.messageId);
    if (validMessageIds.length !== messageIds.length) {
      return NextResponse.json({ error: 'One or more messages not found or unauthorized' }, { status: 403 });
    }

    let successCount = 0;
    const rollbackMessages: { messageId: string; addedLabels: string[]; removedLabels: string[] }[] = [];

    for (const messageId of messageIds) {
      try {
        if (action === 'archive') {
          // Archive means removing from INBOX
          await gmailService.modifyMessageLabels(messageId, [], ['INBOX']);
          rollbackMessages.push({ messageId, addedLabels: [], removedLabels: ['INBOX'] });

          // Optimistically update DB
          const email = await prisma.emailMetadata.findFirst({ where: { messageId, userId: session.user.id } });
          if (email) {
            const labels = JSON.parse(email.labelIds || '[]').filter((l: string) => l !== 'INBOX');
            await prisma.emailMetadata.update({
              where: { messageId },
              data: { labelIds: JSON.stringify(labels) },
            });
          }
        } else if (action === 'mark-read') {
          await gmailService.modifyMessageLabels(messageId, [], ['UNREAD']);
          rollbackMessages.push({ messageId, addedLabels: [], removedLabels: ['UNREAD'] });

          await prisma.emailMetadata.updateMany({
            where: { messageId, userId: session.user.id },
            data: { isUnread: false },
          });
        } else if (action === 'mark-unread') {
          await gmailService.modifyMessageLabels(messageId, ['UNREAD'], []);
          rollbackMessages.push({ messageId, addedLabels: ['UNREAD'], removedLabels: [] });

          await prisma.emailMetadata.updateMany({
            where: { messageId, userId: session.user.id },
            data: { isUnread: true },
          });
        } else if (action === 'label') {
          await gmailService.modifyMessageLabels(messageId, [labelId], []);
          rollbackMessages.push({ messageId, addedLabels: [labelId], removedLabels: [] });

          const email = await prisma.emailMetadata.findFirst({ where: { messageId, userId: session.user.id } });
          if (email) {
            const labels = JSON.parse(email.labelIds || '[]');
            if (!labels.includes(labelId)) {
              labels.push(labelId);
              await prisma.emailMetadata.update({
                where: { messageId },
                data: { labelIds: JSON.stringify(labels) },
              });
            }
          }
        } else if (action === 'trash') {
          await gmailService.trashMessage(messageId);

          // Delete from local DB cache since it's trashed
          await prisma.emailMetadata.deleteMany({
            where: { messageId },
          });
        }
        successCount++;
      } catch (err) {
        console.error(`Failed to apply ${action} to message ${messageId}:`, err);
      }
    }

    const actionTextMap: Record<string, string> = {
      archive: 'Archived',
      trash: 'Trashed',
      'mark-read': 'Marked as read',
      'mark-unread': 'Marked as unread',
      label: `Labeled (ID: ${labelId})`,
    };
    const actionKeyMap: Record<string, string> = {
      archive: 'BULK_ARCHIVE',
      trash: 'BULK_TRASH',
      'mark-read': 'BULK_MARK_READ',
      'mark-unread': 'BULK_MARK_UNREAD',
      label: 'BULK_LABEL',
    };

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: actionKeyMap[action],
        description: `${actionTextMap[action]} ${successCount} emails`,
        metadata: action === 'trash' ? null : JSON.stringify({ messages: rollbackMessages }),
      },
    });

    return NextResponse.json({ success: true, processed: successCount, total: messageIds.length });
  } catch (error: unknown) {
    console.error('Bulk Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
