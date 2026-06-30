import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { getAllProviderDescriptors } from '@inboxctrl/ai';

import { encryptAiApiKey, getEnvApiKey } from '@/lib/ai-secrets';
import { handleApiRouteError, jsonApiSuccess, requireAuthenticatedUser } from '@/lib/api/contracts';
import { formatAiSettings, parseAiSettingsUpdate, parseJsonObject } from '@/lib/api/launch-contracts';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session-user';

/**
 * GET /api/settings/ai
 *
 * Returns current AI configuration without exposing secrets.
 */
export async function GET(_req: NextRequest) {
  try {
    const user = requireAuthenticatedUser(await getCurrentUser(await headers()));

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    const providerId = settings?.aiProviderId ?? 'openai';
    const usesEnvKey = !settings?.aiApiKeySet && Boolean(getEnvApiKey(providerId));

    return jsonApiSuccess({
      settings: formatAiSettings(settings, usesEnvKey),
      supportedProviders: getAllProviderDescriptors(),
    });
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'AI_SETTINGS_FETCH_FAILED',
      message: 'Failed to fetch AI settings',
    });
  }
}

/**
 * POST /api/settings/ai
 *
 * Updates AI provider configuration. Accepts:
 *   - aiEnabled (boolean)
 *   - providerId (string)
 *   - model (string)
 *   - apiKey (string, optional - will be stored encrypted)
 *   - clearApiKey (boolean - removes stored key)
 */
export async function POST(req: NextRequest) {
  try {
    const user = requireAuthenticatedUser(await getCurrentUser(await headers()));
    const body = await parseJsonObject(req);
    const { updateData, apiKey } = parseAiSettingsUpdate(body);

    if (apiKey) {
      updateData.aiApiKeyEncrypted = encryptAiApiKey(apiKey);
      updateData.aiApiKeySet = true;
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...updateData,
      },
      update: updateData,
    });

    return jsonApiSuccess({
      settings: formatAiSettings(settings, false),
    });
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'AI_SETTINGS_UPDATE_FAILED',
      message: 'Failed to update AI settings',
    });
  }
}
