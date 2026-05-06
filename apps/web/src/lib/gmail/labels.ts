/**
 * @deprecated Label sync logic has moved to '@inboxctrl/sync-engine'.
 *
 * This file exists for backwards compatibility during migration.
 * It delegates to the new sync-engine package.
 */
import { GmailClient } from '@inboxctrl/gmail';
import { syncLabels } from '@inboxctrl/sync-engine';

import { prisma } from '@/lib/prisma';

export async function syncLabelsLegacy(accessToken: string, userId: string) {
  const gmail = new GmailClient({ accessToken });

  const result = await syncLabels(
    gmail,
    {
      upsertLabel: async (data) => {
        await prisma.label.upsert({
          where: { gmailId: data.gmailId },
          update: { name: data.name, type: data.type, color: data.color },
          create: { gmailId: data.gmailId, userId: data.userId, name: data.name, type: data.type, color: data.color },
        });
      },
      findEmail: async () => null,
      upsertEmail: async () => {},
    },
    { userId }
  );

  return result.labels;
}

export { syncLabelsLegacy as syncLabels };
