import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';

import {
  DEMO_ACCOUNT_ID,
  DEMO_EMAIL,
  DEMO_SCOPES,
  DEMO_USER_ID,
  demoActivityLogs,
  demoEmails,
  demoLabels,
} from './fixtures';

import type { PrismaClient } from '@prisma/client';

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), '..', '..', '..');
const webEnvPath = path.join(repoRoot, 'apps', 'web', '.env');
const defaultDemoDbPath = path.join(repoRoot, 'apps', 'web', 'prisma', 'dev.db').replaceAll(path.sep, '/');

if (existsSync(webEnvPath)) {
  loadEnv({ path: webEnvPath });
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'file:./dev.db') {
  process.env.DATABASE_URL = `file:${defaultDemoDbPath}`;
}

const getPrisma = async (): Promise<PrismaClient> => {
  const { PrismaClient } = await import('@prisma/client');
  return new PrismaClient();
};

export const resetDemoData = async () => {
  const prisma = await getPrisma();

  try {
    await prisma.$transaction([
      prisma.activityLog.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.emailMetadata.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.label.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.account.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.userSettings.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.user.deleteMany({ where: { id: DEMO_USER_ID } }),
    ]);
  } finally {
    await prisma.$disconnect();
  }
};

export const seedDemoData = async () => {
  const prisma = await getPrisma();
  const now = new Date();

  try {
    await prisma.user.upsert({
      where: { id: DEMO_USER_ID },
      update: {
        email: DEMO_EMAIL,
        name: 'InboxCtrl Demo',
        lastSyncAt: now,
      },
      create: {
        id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        name: 'InboxCtrl Demo',
        emailVerified: true,
        lastSyncAt: now,
      },
    });

    await prisma.account.upsert({
      where: { id: DEMO_ACCOUNT_ID },
      update: {
        accessToken: 'demo-access-token',
        scope: DEMO_SCOPES.join(' '),
      },
      create: {
        id: DEMO_ACCOUNT_ID,
        userId: DEMO_USER_ID,
        accountId: DEMO_EMAIL,
        providerId: 'google',
        accessToken: 'demo-access-token',
        scope: DEMO_SCOPES.join(' '),
      },
    });

    for (const label of demoLabels) {
      await prisma.label.upsert({
        where: { gmailId: label.gmailId },
        update: {
          userId: DEMO_USER_ID,
          name: label.name,
          type: label.type,
          color: label.color,
        },
        create: {
          gmailId: label.gmailId,
          userId: DEMO_USER_ID,
          name: label.name,
          type: label.type,
          color: label.color,
        },
      });
    }

    for (const email of demoEmails) {
      await prisma.emailMetadata.upsert({
        where: { messageId: email.messageId },
        update: {
          userId: DEMO_USER_ID,
          threadId: email.threadId,
          from: email.from,
          to: email.to,
          subject: email.subject,
          snippet: email.snippet,
          sender: email.sender,
          date: new Date(email.date),
          isUnread: email.isUnread,
          isStarred: email.isStarred,
          hasAttach: email.hasAttach,
          labelIds: JSON.stringify(email.labelIds),
        },
        create: {
          messageId: email.messageId,
          threadId: email.threadId,
          userId: DEMO_USER_ID,
          from: email.from,
          to: email.to,
          subject: email.subject,
          snippet: email.snippet,
          sender: email.sender,
          date: new Date(email.date),
          isUnread: email.isUnread,
          isStarred: email.isStarred,
          hasAttach: email.hasAttach,
          labelIds: JSON.stringify(email.labelIds),
        },
      });
    }

    await prisma.userSettings.upsert({
      where: { userId: DEMO_USER_ID },
      update: {
        aiEnabled: true,
        aiProviderId: 'demo',
        aiModel: 'deterministic-demo',
        allowExternalAi: false,
        allowFullBodyFetch: true,
        allowDestructiveActions: false,
        requireBulkConfirmation: true,
        allowAiOutputStorage: false,
      },
      create: {
        userId: DEMO_USER_ID,
        aiEnabled: true,
        aiProviderId: 'demo',
        aiModel: 'deterministic-demo',
        allowExternalAi: false,
        allowFullBodyFetch: true,
        allowDestructiveActions: false,
        requireBulkConfirmation: true,
        allowAiOutputStorage: false,
      },
    });

    for (const log of demoActivityLogs) {
      await prisma.activityLog.create({
        data: {
          userId: DEMO_USER_ID,
          action: log.action,
          description: log.description,
          metadata: log.metadata,
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
};
