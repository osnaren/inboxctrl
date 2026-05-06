import { prisma } from '@/lib/prisma';

import { getGmailClient } from './client';

export async function syncLabels(accessToken: string, userId: string) {
  const gmail = await getGmailClient(accessToken);

  try {
    const listRes = await gmail.users.labels.list({ userId: 'me' });
    const labels = listRes.data.labels;

    if (!labels) return [];

    const syncedLabels = [];

    for (const label of labels) {
      if (!label.id || !label.name) continue;

      const savedLabel = await prisma.label.upsert({
        where: { gmailId: label.id },
        update: {
          name: label.name,
          type: label.type || 'system',
          color: label.color?.backgroundColor || null,
        },
        create: {
          gmailId: label.id,
          userId: userId,
          name: label.name,
          type: label.type || 'system',
          color: label.color?.backgroundColor || null,
        },
      });

      syncedLabels.push(savedLabel);
    }

    return syncedLabels;
  } catch (error) {
    console.error('Error syncing labels:', error);
    throw error;
  }
}
