
import { withBackoff } from './backoff';

import type { MetadataSyncOptions, MetadataSyncResult, SyncDbAdapter, SyncError, SyncGmailClient } from './types';
import type { GmailMessageMeta } from '@inboxctrl/gmail';

/**
 * Orchestrates Gmail message metadata synchronisation to the local database.
 *
 * - Fetches a page of message IDs from Gmail.
 * - Skips messages already in the local cache.
 * - Fetches metadata for new messages and upserts.
 * - Isolates per-message errors so one failure doesn't abort the batch.
 * - Uses exponential backoff for rate-limit retries.
 */
export async function syncMetadata(
  gmail: SyncGmailClient,
  db: SyncDbAdapter,
  options: MetadataSyncOptions
): Promise<MetadataSyncResult> {
  const listResult = await gmail.listMessages({
    maxResults: options.maxResults ?? 50,
    labelIds: options.labelIds ?? ['INBOX'],
    pageToken: options.pageToken,
  });

  const messageRefs = listResult.messages;
  const total = messageRefs.length;
  let synced = 0;
  let skipped = 0;
  let failed = 0;
  const errors: SyncError[] = [];

  for (let i = 0; i < total; i++) {
    const ref = messageRefs[i];

    try {
      // Check local cache first
      const existing = await db.findEmail(ref.id);
      if (existing) {
        skipped++;
        continue;
      }

      // Fetch metadata from Gmail with retry on rate limit
      const meta: GmailMessageMeta = await withBackoff(() => gmail.getMessageMetadata(ref.id), {
        maxRetries: 3,
        shouldRetry: (error) => {
          const err = error as { code?: number };
          return err.code === 429;
        },
      });

      // Parse date safely
      let parsedDate = new Date();
      if (meta.headers.date) {
        const d = new Date(meta.headers.date);
        if (!isNaN(d.getTime())) {
          parsedDate = d;
        }
      }

      await db.upsertEmail({
        messageId: meta.id,
        threadId: meta.threadId,
        userId: options.userId,
        from: meta.headers.from,
        to: meta.headers.to,
        subject: meta.headers.subject,
        snippet: meta.snippet,
        date: parsedDate,
        isUnread: meta.labelIds.includes('UNREAD'),
        isStarred: meta.labelIds.includes('STARRED'),
        labelIds: JSON.stringify(meta.labelIds),
      });

      synced++;
    } catch (error) {
      failed++;
      const errMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        messageId: ref.id,
        code: 'SYNC_MESSAGE_FAILED',
        message: errMsg,
      });
    }

    options.onProgress?.({
      phase: 'messages',
      current: i + 1,
      total,
      pct: Math.round(((i + 1) / total) * 100),
    });
  }

  return {
    synced,
    skipped,
    failed,
    nextPageToken: listResult.nextPageToken,
    errors,
  };
}
