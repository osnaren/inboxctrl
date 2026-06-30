import type { GmailLabelInfo, GmailMessageMeta } from '@inboxctrl/gmail';

// ---------------------------------------------------------------------------
// Sync result types
// ---------------------------------------------------------------------------

export interface SyncResult {
  syncedLabels: number;
  syncedMessages: number;
}

export type MaybePromise<T> = T | Promise<T>;

export interface LabelSyncResult {
  synced: number;
  labels: Array<{ gmailId: string; name: string }>;
}

export interface MetadataSyncResult {
  synced: number;
  skipped: number;
  failed: number;
  nextPageToken: string | null;
  errors: SyncError[];
}

export interface SyncError {
  messageId?: string;
  code: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Sync progress tracking
// ---------------------------------------------------------------------------

export interface SyncProgress {
  phase: 'labels' | 'messages';
  current: number;
  total: number;
  /** Percentage 0-100 */
  pct: number;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

// ---------------------------------------------------------------------------
// Sync options
// ---------------------------------------------------------------------------

export interface LabelSyncOptions {
  userId: string;
  onProgress?: SyncProgressCallback;
}

export interface MetadataSyncOptions {
  userId: string;
  maxResults?: number;
  labelIds?: string[];
  pageToken?: string;
  onProgress?: SyncProgressCallback;
}

export interface FullSyncOptions {
  userId: string;
  maxMessages?: number;
  onProgress?: SyncProgressCallback;
}

// ---------------------------------------------------------------------------
// Sync engine dependencies (injected)
// ---------------------------------------------------------------------------

/**
 * Minimal Gmail client surface needed by the sync engine.
 *
 * This matches a subset of {@link import('@inboxctrl/gmail').GmailClient}
 * so callers pass the real client, but the engine is testable with a stub.
 */
export interface SyncGmailClient {
  listLabels(): Promise<GmailLabelInfo[]>;
  listMessages(options?: { maxResults?: number; labelIds?: string[]; pageToken?: string }): Promise<{
    messages: Array<{ id: string; threadId: string }>;
    nextPageToken: string | null;
  }>;
  getMessageMetadata(messageId: string): Promise<GmailMessageMeta>;
}

/**
 * Minimal DB surface needed by the sync engine.
 */
export interface SyncDbAdapter {
  upsertLabel(data: {
    gmailId: string;
    userId: string;
    name: string;
    type: string;
    color: string | null;
  }): Promise<void>;
  findEmail(messageId: string): Promise<{ messageId: string } | null>;
  upsertEmail(data: {
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
  }): Promise<void>;
}

// ---------------------------------------------------------------------------
// Sync lock types
// ---------------------------------------------------------------------------

export interface SyncLock {
  acquire(key: string): MaybePromise<boolean>;
  release(key: string): MaybePromise<void>;
  isLocked(key: string): MaybePromise<boolean>;
}

// ---------------------------------------------------------------------------
// Backoff config
// ---------------------------------------------------------------------------

export interface BackoffConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  jitter: boolean;
}

export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelayMs: 1000,
  maxDelayMs: 60_000,
  multiplier: 2,
  jitter: true,
};
