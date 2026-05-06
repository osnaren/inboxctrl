/**
 * @deprecated Email sync logic has moved to '@inboxctrl/sync-engine'.
 *
 * This file exists for backwards compatibility during migration.
 * It delegates to the new sync-engine package.
 */
import { GmailClient } from '@inboxctrl/gmail';
import { syncMetadata } from '@inboxctrl/sync-engine';

import { prisma } from '@/lib/prisma';

export async function fetchAndSyncRecentEmails(accessToken: string, userId: string, maxResults = 50) {
  const gmail = new GmailClient({ accessToken });

  await syncMetadata(
    gmail,
    {
      upsertLabel: async () => {},
      findEmail: async (messageId) => {
        const existing = await prisma.emailMetadata.findUnique({ where: { messageId } });
        return existing ? { messageId: existing.messageId } : null;
      },
      upsertEmail: async (data) => {
        await prisma.emailMetadata.upsert({
          where: { messageId: data.messageId },
          update: {
            threadId: data.threadId,
            from: data.from,
            to: data.to,
            subject: data.subject,
            snippet: data.snippet,
            date: data.date,
            isUnread: data.isUnread,
            isStarred: data.isStarred,
            labelIds: data.labelIds,
          },
          create: {
            messageId: data.messageId,
            threadId: data.threadId,
            userId: data.userId,
            from: data.from,
            to: data.to,
            subject: data.subject,
            snippet: data.snippet,
            date: data.date,
            isUnread: data.isUnread,
            isStarred: data.isStarred,
            labelIds: data.labelIds,
          },
        });
      },
    },
    { userId, maxResults }
  );

  // Return the synced emails from DB for backwards compat
  return prisma.emailMetadata.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: maxResults,
  });
}
