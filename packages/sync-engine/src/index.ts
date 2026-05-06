// Engine
export { SyncEngine } from './engine';

// Individual sync operations
export { syncLabels } from './label-sync';
export { syncMetadata } from './metadata-sync';

// Lock
export { InProcessSyncLock } from './sync-lock';

// Backoff utilities
export { backoff, withBackoff } from './backoff';

// Types
export type {
  BackoffConfig,
  FullSyncOptions,
  LabelSyncOptions,
  LabelSyncResult,
  MetadataSyncOptions,
  MetadataSyncResult,
  SyncDbAdapter,
  SyncError,
  SyncGmailClient,
  SyncLock,
  SyncProgress,
  SyncProgressCallback,
  SyncResult,
} from './types';

export { DEFAULT_BACKOFF_CONFIG } from './types';
