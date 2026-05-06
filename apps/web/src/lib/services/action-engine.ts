/**
 * Action Engine - composable bulk action executor with safety checks,
 * partial failure tracking, optimistic local cache updates, and undo support.
 *
 * This lives in the app layer because it orchestrates between Gmail (via
 * GmailService) and the local DB (via Prisma). Domain packages provide
 * the building blocks; this module wires them for the web app.
 */
import { prisma } from '@/lib/prisma';
import { GmailService } from '@/lib/services/gmail.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionType =
  | 'archive'
  | 'trash'
  | 'mark-read'
  | 'mark-unread'
  | 'star'
  | 'unstar'
  | 'apply-label'
  | 'remove-label';

export interface ActionRequest {
  messageIds: string[];
  action: ActionType;
  labelId?: string; // Required for apply-label / remove-label
}

export interface ActionResultItem {
  messageId: string;
  success: boolean;
  error?: string;
  rollbackData?: {
    addedLabels: string[];
    removedLabels: string[];
  };
}

export interface ActionResult {
  success: boolean;
  action: ActionType;
  processed: number;
  failed: number;
  total: number;
  results: ActionResultItem[];
  activityLogId: string | null;
}

const ACTION_META: Record<ActionType, { logKey: string; logLabel: string; destructive: boolean }> = {
  archive: { logKey: 'BULK_ARCHIVE', logLabel: 'Archived', destructive: false },
  trash: { logKey: 'BULK_TRASH', logLabel: 'Trashed', destructive: true },
  'mark-read': { logKey: 'BULK_MARK_READ', logLabel: 'Marked as read', destructive: false },
  'mark-unread': { logKey: 'BULK_MARK_UNREAD', logLabel: 'Marked as unread', destructive: false },
  star: { logKey: 'BULK_STAR', logLabel: 'Starred', destructive: false },
  unstar: { logKey: 'BULK_UNSTAR', logLabel: 'Unstarred', destructive: false },
  'apply-label': { logKey: 'BULK_LABEL', logLabel: 'Applied label', destructive: false },
  'remove-label': { logKey: 'BULK_REMOVE_LABEL', logLabel: 'Removed label', destructive: false },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class ActionEngine {
  private gmail: GmailService;
  private userId: string;

  constructor(gmail: GmailService, userId: string) {
    this.gmail = gmail;
    this.userId = userId;
  }

  /**
   * Check whether the action is allowed by the user's safety settings.
   */
  async checkSafety(action: ActionType): Promise<{ allowed: boolean; reason?: string }> {
    const meta = ACTION_META[action];
    if (!meta.destructive) return { allowed: true };

    const settings = await prisma.userSettings.findUnique({
      where: { userId: this.userId },
    });

    if (!settings?.allowDestructiveActions) {
      return {
        allowed: false,
        reason: `Destructive action "${action}" is disabled. Enable "Allow destructive actions" in Safety & Privacy settings.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Execute a batch of actions with per-message error isolation.
   */
  async execute(request: ActionRequest): Promise<ActionResult> {
    const { messageIds, action, labelId } = request;
    const results: ActionResultItem[] = [];

    for (const messageId of messageIds) {
      try {
        const rollback = await this.applyAction(messageId, action, labelId);
        results.push({ messageId, success: true, rollbackData: rollback });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`ActionEngine: Failed to apply ${action} to ${messageId}:`, err);
        results.push({ messageId, success: false, error: errorMsg });
      }
    }

    const processed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const meta = ACTION_META[action];

    // Record activity log with rollback metadata
    let activityLogId: string | null = null;
    if (processed > 0) {
      const rollbackMessages = results
        .filter((r) => r.success && r.rollbackData)
        .map((r) => ({
          messageId: r.messageId,
          addedLabels: r.rollbackData!.addedLabels,
          removedLabels: r.rollbackData!.removedLabels,
        }));

      const log = await prisma.activityLog.create({
        data: {
          userId: this.userId,
          action: meta.logKey,
          description: `${meta.logLabel} ${processed} email${processed !== 1 ? 's' : ''}${labelId ? ` (label: ${labelId})` : ''}${failed > 0 ? ` (${failed} failed)` : ''}`,
          metadata: action === 'trash' ? null : JSON.stringify({ messages: rollbackMessages }),
        },
      });
      activityLogId = log.id;
    }

    return {
      success: failed === 0,
      action,
      processed,
      failed,
      total: messageIds.length,
      results,
      activityLogId,
    };
  }

  /**
   * Rollback an activity log entry by reversing label changes.
   */
  async rollback(activityLogId: string): Promise<{ success: boolean; reversedCount: number }> {
    const log = await prisma.activityLog.findFirst({
      where: { id: activityLogId, userId: this.userId },
    });

    if (!log) throw new Error('Activity log not found');
    if (log.isRolledBack) throw new Error('Already rolled back');
    if (!log.metadata) throw new Error('No rollback metadata available');

    const data = JSON.parse(log.metadata) as {
      messages: { messageId: string; addedLabels: string[]; removedLabels: string[] }[];
    };

    let reversedCount = 0;
    for (const msg of data.messages || []) {
      try {
        // Reverse: add what was removed, remove what was added
        await this.gmail.modifyMessageLabels(msg.messageId, msg.removedLabels, msg.addedLabels);
        await this.updateLocalLabels(msg.messageId, msg.removedLabels, msg.addedLabels);
        await this.updateLocalFlagsFromLabels(msg.messageId, msg.removedLabels, msg.addedLabels);
        reversedCount++;
      } catch (err) {
        console.error(`ActionEngine: Failed to rollback ${msg.messageId}:`, err);
      }
    }

    await prisma.activityLog.update({
      where: { id: activityLogId },
      data: { isRolledBack: true },
    });

    return { success: true, reversedCount };
  }

  // ---------------------------------------------------------------------------
  // Private: per-action handlers
  // ---------------------------------------------------------------------------

  private async applyAction(
    messageId: string,
    action: ActionType,
    labelId?: string
  ): Promise<{ addedLabels: string[]; removedLabels: string[] }> {
    switch (action) {
      case 'archive':
        await this.gmail.modifyMessageLabels(messageId, [], ['INBOX']);
        await this.updateLocalLabels(messageId, [], ['INBOX']);
        return { addedLabels: [], removedLabels: ['INBOX'] };

      case 'trash':
        await this.gmail.trashMessage(messageId);
        await prisma.emailMetadata.deleteMany({ where: { messageId } });
        return { addedLabels: [], removedLabels: [] };

      case 'mark-read':
        await this.gmail.modifyMessageLabels(messageId, [], ['UNREAD']);
        await prisma.emailMetadata.updateMany({
          where: { messageId, userId: this.userId },
          data: { isUnread: false },
        });
        return { addedLabels: [], removedLabels: ['UNREAD'] };

      case 'mark-unread':
        await this.gmail.modifyMessageLabels(messageId, ['UNREAD'], []);
        await prisma.emailMetadata.updateMany({
          where: { messageId, userId: this.userId },
          data: { isUnread: true },
        });
        return { addedLabels: ['UNREAD'], removedLabels: [] };

      case 'star':
        await this.gmail.modifyMessageLabels(messageId, ['STARRED'], []);
        await prisma.emailMetadata.updateMany({
          where: { messageId, userId: this.userId },
          data: { isStarred: true },
        });
        return { addedLabels: ['STARRED'], removedLabels: [] };

      case 'unstar':
        await this.gmail.modifyMessageLabels(messageId, [], ['STARRED']);
        await prisma.emailMetadata.updateMany({
          where: { messageId, userId: this.userId },
          data: { isStarred: false },
        });
        return { addedLabels: [], removedLabels: ['STARRED'] };

      case 'apply-label':
        if (!labelId) throw new Error('labelId required for apply-label');
        await this.gmail.modifyMessageLabels(messageId, [labelId], []);
        await this.updateLocalLabels(messageId, [labelId], []);
        return { addedLabels: [labelId], removedLabels: [] };

      case 'remove-label':
        if (!labelId) throw new Error('labelId required for remove-label');
        await this.gmail.modifyMessageLabels(messageId, [], [labelId]);
        await this.updateLocalLabels(messageId, [], [labelId]);
        return { addedLabels: [], removedLabels: [labelId] };

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  /**
   * Optimistically update the local label cache for a message.
   */
  private async updateLocalLabels(messageId: string, addLabels: string[], removeLabels: string[]) {
    const email = await prisma.emailMetadata.findFirst({
      where: { messageId, userId: this.userId },
    });
    if (!email) return;

    let labels = parseLabelIds(email.labelIds);

    for (const add of addLabels) {
      if (!labels.includes(add)) labels.push(add);
    }

    labels = labels.filter((l) => !removeLabels.includes(l));

    await prisma.emailMetadata.update({
      where: { messageId },
      data: { labelIds: JSON.stringify(labels) },
    });
  }

  private async updateLocalFlagsFromLabels(messageId: string, addedLabels: string[], removedLabels: string[]) {
    const data: { isUnread?: boolean; isStarred?: boolean } = {};

    if (addedLabels.includes('UNREAD')) data.isUnread = true;
    if (removedLabels.includes('UNREAD')) data.isUnread = false;
    if (addedLabels.includes('STARRED')) data.isStarred = true;
    if (removedLabels.includes('STARRED')) data.isStarred = false;

    if (Object.keys(data).length === 0) return;

    await prisma.emailMetadata.updateMany({
      where: { messageId, userId: this.userId },
      data,
    });
  }
}

function parseLabelIds(value: string): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((label): label is string => typeof label === 'string') : [];
  } catch {
    return [];
  }
}
