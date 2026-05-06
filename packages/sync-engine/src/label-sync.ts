import type { LabelSyncOptions, LabelSyncResult, SyncGmailClient, SyncDbAdapter } from './types';

/**
 * Orchestrates Gmail label synchronisation to the local database.
 *
 * Pure orchestration - no Prisma or googleapis import. Dependencies are
 * injected so the function is easily testable.
 */
export async function syncLabels(
  gmail: SyncGmailClient,
  db: SyncDbAdapter,
  options: LabelSyncOptions
): Promise<LabelSyncResult> {
  const gmailLabels = await gmail.listLabels();
  const synced: LabelSyncResult['labels'] = [];

  for (let i = 0; i < gmailLabels.length; i++) {
    const label = gmailLabels[i];
    if (!label.id || !label.name) continue;

    await db.upsertLabel({
      gmailId: label.id,
      userId: options.userId,
      name: label.name,
      type: label.type || 'system',
      color: label.color ?? null,
    });

    synced.push({ gmailId: label.id, name: label.name });

    options.onProgress?.({
      phase: 'labels',
      current: i + 1,
      total: gmailLabels.length,
      pct: Math.round(((i + 1) / gmailLabels.length) * 100),
    });
  }

  return { synced: synced.length, labels: synced };
}
