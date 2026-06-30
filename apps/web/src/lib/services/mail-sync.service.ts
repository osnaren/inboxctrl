import { currentDatabaseProfile } from '@inboxctrl/db';
import { InProcessSyncLock, SyncEngine } from '@inboxctrl/sync-engine';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { ApiRouteError, apiError } from '@/lib/api/contracts';
import { prisma } from '@/lib/prisma';

import type { GmailService } from './gmail.service';
import type { SyncDbAdapter, SyncLock, SyncResult } from '@inboxctrl/sync-engine';

const sharedInProcessSyncLock = new InProcessSyncLock();

class PrismaSyncDbAdapter implements SyncDbAdapter {
  async upsertLabel(data: { gmailId: string; userId: string; name: string; type: string; color: string | null }) {
    await prisma.label.upsert({
      where: { gmailId: data.gmailId },
      update: {
        name: data.name,
        type: data.type,
        color: data.color,
      },
      create: data,
    });
  }

  async findEmail(messageId: string) {
    return prisma.emailMetadata.findUnique({
      where: { messageId },
      select: { messageId: true },
    });
  }

  async upsertEmail(data: {
    messageId: string;
    threadId: string;
    userId: string;
    from: string;
    to: string;
    subject: string;
    snippet: string;
    date: Date;
    isUnread: boolean;
    isStarred: boolean;
    labelIds: string;
  }) {
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
      create: data,
    });
  }
}

class PrismaSyncLock implements SyncLock {
  private readonly lockTtlMs = 5 * 60 * 1000;

  constructor(private readonly userId: string) {}

  private getStateWhere(syncKey: string) {
    return {
      userId_syncKey: {
        userId: this.userId,
        syncKey,
      },
    };
  }

  async acquire(syncKey: string) {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + this.lockTtlMs);

    const updated = await prisma.syncState.updateMany({
      where: {
        userId: this.userId,
        syncKey,
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      data: {
        status: 'syncing',
        lockedAt: now,
        lockedUntil,
        lastError: null,
      },
    });

    if (updated.count > 0) {
      return true;
    }

    try {
      await prisma.syncState.create({
        data: {
          userId: this.userId,
          syncKey,
          status: 'syncing',
          lockedAt: now,
          lockedUntil,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }

      throw error;
    }
  }

  async release(syncKey: string) {
    await prisma.syncState.upsert({
      where: this.getStateWhere(syncKey),
      create: {
        userId: this.userId,
        syncKey,
        status: 'idle',
      },
      update: {
        status: 'idle',
        lockedAt: null,
        lockedUntil: null,
      },
    });
  }

  async isLocked(syncKey: string) {
    const state = await prisma.syncState.findUnique({
      where: this.getStateWhere(syncKey),
      select: { lockedUntil: true },
    });

    return Boolean(state?.lockedUntil && state.lockedUntil.getTime() > Date.now());
  }
}

export class MailSyncService {
  private readonly dbAdapter = new PrismaSyncDbAdapter();

  private getLock(userId: string): SyncLock {
    return currentDatabaseProfile === 'postgres' ? new PrismaSyncLock(userId) : sharedInProcessSyncLock;
  }

  private async recordSuccess(userId: string, result: SyncResult) {
    const syncKey = `sync:${userId}`;
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { lastSyncAt: now },
      }),
      prisma.syncState.upsert({
        where: {
          userId_syncKey: {
            userId,
            syncKey,
          },
        },
        create: {
          userId,
          syncKey,
          status: 'idle',
          lastSyncedAt: now,
          lastResult: JSON.stringify(result),
        },
        update: {
          status: 'idle',
          lockedAt: null,
          lockedUntil: null,
          lastSyncedAt: now,
          lastError: null,
          lastResult: JSON.stringify(result),
        },
      }),
    ]);
  }

  private async recordFailure(userId: string, error: unknown) {
    const syncKey = `sync:${userId}`;
    await prisma.syncState.upsert({
      where: {
        userId_syncKey: {
          userId,
          syncKey,
        },
      },
      create: {
        userId,
        syncKey,
        status: 'idle',
        lastError: error instanceof Error ? error.message : String(error),
      },
      update: {
        status: 'idle',
        lockedAt: null,
        lockedUntil: null,
        lastError: error instanceof Error ? error.message : String(error),
      },
    });
  }

  async syncUserMailbox(userId: string, gmailService: GmailService) {
    const engine = new SyncEngine(this.getLock(userId));

    try {
      const result = await engine.fullSync(gmailService, this.dbAdapter, {
        userId,
        maxMessages: 25,
      });

      await this.recordSuccess(userId, result);
      return result;
    } catch (error) {
      await this.recordFailure(userId, error);

      if (error instanceof Error && error.message === 'A sync is already in progress for this user') {
        throw apiError(409, 'SYNC_IN_PROGRESS', error.message);
      }

      if (error instanceof ApiRouteError) {
        throw error;
      }

      throw apiError(
        500,
        'SYNC_FAILED',
        'Failed to sync mailbox metadata',
        error instanceof Error ? error.message : error
      );
    }
  }
}
