import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { handleApiRouteError, jsonApiSuccess, requireAuthenticatedUser } from '@/lib/api/contracts';
import {
  DEFAULT_PRIVACY_SETTINGS,
  formatPrivacySettings,
  parseJsonObject,
  parsePrivacySettingsUpdate,
} from '@/lib/api/launch-contracts';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session-user';

/**
 * GET /api/settings/privacy
 *
 * Returns the current safety and privacy settings for the authenticated user.
 * If no settings row exists yet, returns safe defaults.
 */
export async function GET(_req: NextRequest) {
  try {
    const user = requireAuthenticatedUser(await getCurrentUser(await headers()));

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    return jsonApiSuccess({
      settings: formatPrivacySettings(settings),
      isDefault: !settings,
    });
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'PRIVACY_SETTINGS_FETCH_FAILED',
      message: 'Failed to fetch privacy settings',
    });
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
    const user = requireAuthenticatedUser(await getCurrentUser(await headers()));
    const body = await parseJsonObject(req);
    const updateData = parsePrivacySettingsUpdate(body);

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...DEFAULT_PRIVACY_SETTINGS,
        ...updateData,
      },
      update: updateData,
    });

    return jsonApiSuccess({
      settings: formatPrivacySettings(settings),
    });
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'PRIVACY_SETTINGS_UPDATE_FAILED',
      message: 'Failed to update privacy settings',
    });
  }
}
