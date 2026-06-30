import { syncLabels } from './label-sync';
import { syncMetadata } from './metadata-sync';
import { InProcessSyncLock } from './sync-lock';

import type { FullSyncOptions, SyncDbAdapter, SyncGmailClient, SyncLock, SyncResult } from './types';

/**
 * High-level sync engine that orchestrates a full label + metadata sync.
 *
 * - Acquires an in-process lock so concurrent calls for the same user are
 *   serialised.
 * - Runs label sync first, then metadata sync.
 * - Reports progress through the optional callback.
 */
export class SyncEngine {
  private readonly lock: SyncLock;

  constructor(lock: SyncLock = new InProcessSyncLock()) {
    this.lock = lock;
  }

  async fullSync(gmail: SyncGmailClient, db: SyncDbAdapter, options: FullSyncOptions): Promise<SyncResult> {
    const lockKey = `sync:${options.userId}`;

    if (!(await this.lock.acquire(lockKey))) {
      throw new Error('A sync is already in progress for this user');
    }

    try {
      // Phase 1: Labels
      const labelResult = await syncLabels(gmail, db, {
        userId: options.userId,
        onProgress: options.onProgress,
      });

      // Phase 2: Messages
      const metadataResult = await syncMetadata(gmail, db, {
        userId: options.userId,
        maxResults: options.maxMessages ?? 50,
        onProgress: options.onProgress,
      });

      return {
        syncedLabels: labelResult.synced,
        syncedMessages: metadataResult.synced,
      };
    } finally {
      await this.lock.release(lockKey);
    }
  }

  async isSyncing(userId: string): Promise<boolean> {
    return this.lock.isLocked(`sync:${userId}`);
  }
}
