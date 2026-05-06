import type { SyncLock } from './types';

/**
 * Simple in-process sync lock.
 *
 * Prevents concurrent syncs for the same user/key. This is sufficient for
 * single-process deployments. For multi-process or clustered environments,
 * replace with a Redis- or DB-backed lock implementation that satisfies the
 * {@link SyncLock} interface.
 */
export class InProcessSyncLock implements SyncLock {
  private readonly locks = new Set<string>();

  acquire(key: string): boolean {
    if (this.locks.has(key)) return false;
    this.locks.add(key);
    return true;
  }

  release(key: string): void {
    this.locks.delete(key);
  }

  isLocked(key: string): boolean {
    return this.locks.has(key);
  }
}
