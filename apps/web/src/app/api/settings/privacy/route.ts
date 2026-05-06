import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

/**
 * Default settings used when a user hasn't configured privacy settings yet.
 * All sensitive features are disabled by default (safe-by-default posture).
 */
const DEFAULT_PRIVACY_SETTINGS = {
  allowExternalAi: false,
  allowFullBodyFetch: false,
  allowDestructiveActions: false,
  requireBulkConfirmation: true,
  allowAiOutputStorage: false,
  metadataCacheRetentionDays: 90,
  activityLogRetentionDays: 365,
} as const;

/**
 * GET /api/settings/privacy
 *
 * Returns the current safety and privacy settings for the authenticated user.
 * If no settings row exists yet, returns safe defaults.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      settings: {
        allowExternalAi: settings?.allowExternalAi ?? DEFAULT_PRIVACY_SETTINGS.allowExternalAi,
        allowFullBodyFetch: settings?.allowFullBodyFetch ?? DEFAULT_PRIVACY_SETTINGS.allowFullBodyFetch,
        allowDestructiveActions: settings?.allowDestructiveActions ?? DEFAULT_PRIVACY_SETTINGS.allowDestructiveActions,
        requireBulkConfirmation: settings?.requireBulkConfirmation ?? DEFAULT_PRIVACY_SETTINGS.requireBulkConfirmation,
        allowAiOutputStorage: settings?.allowAiOutputStorage ?? DEFAULT_PRIVACY_SETTINGS.allowAiOutputStorage,
        metadataCacheRetentionDays:
          settings?.metadataCacheRetentionDays ?? DEFAULT_PRIVACY_SETTINGS.metadataCacheRetentionDays,
        activityLogRetentionDays:
          settings?.activityLogRetentionDays ?? DEFAULT_PRIVACY_SETTINGS.activityLogRetentionDays,
      },
      isDefault: !settings,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/privacy
 *
 * Upserts the user's safety and privacy settings. Only provided fields are
 * updated; omitted fields retain their current values (or defaults on first save).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Validate retention days
    if (body.metadataCacheRetentionDays !== undefined) {
      const days = Number(body.metadataCacheRetentionDays);
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        return NextResponse.json({ error: 'metadataCacheRetentionDays must be between 1 and 3650' }, { status: 400 });
      }
    }

    if (body.activityLogRetentionDays !== undefined) {
      const days = Number(body.activityLogRetentionDays);
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        return NextResponse.json({ error: 'activityLogRetentionDays must be between 1 and 3650' }, { status: 400 });
      }
    }

    // Build update payload with only provided fields
    const updateData: Record<string, unknown> = {};
    const boolFields = [
      'allowExternalAi',
      'allowFullBodyFetch',
      'allowDestructiveActions',
      'requireBulkConfirmation',
      'allowAiOutputStorage',
    ] as const;

    for (const field of boolFields) {
      if (typeof body[field] === 'boolean') {
        updateData[field] = body[field];
      }
    }

    const intFields = ['metadataCacheRetentionDays', 'activityLogRetentionDays'] as const;
    for (const field of intFields) {
      if (body[field] !== undefined) {
        updateData[field] = Number(body[field]);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...DEFAULT_PRIVACY_SETTINGS,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      settings: {
        allowExternalAi: settings.allowExternalAi,
        allowFullBodyFetch: settings.allowFullBodyFetch,
        allowDestructiveActions: settings.allowDestructiveActions,
        requireBulkConfirmation: settings.requireBulkConfirmation,
        allowAiOutputStorage: settings.allowAiOutputStorage,
        metadataCacheRetentionDays: settings.metadataCacheRetentionDays,
        activityLogRetentionDays: settings.activityLogRetentionDays,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to update privacy settings', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
