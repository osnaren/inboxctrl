import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getAllProviderDescriptors, getProviderDescriptor, type AiProviderId } from '@inboxctrl/ai';

import { encryptAiApiKey, getEnvApiKey } from '@/lib/ai-secrets';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session-user';

/**
 * GET /api/settings/ai
 *
 * Returns current AI configuration without exposing secrets.
 */
export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser(await headers());
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    const providerId = (settings?.aiProviderId ?? 'openai') as AiProviderId;

    return NextResponse.json({
      settings: {
        aiEnabled: settings?.aiEnabled ?? false,
        providerId,
        model: settings?.aiModel ?? getProviderDescriptor(providerId)?.defaultModel ?? 'gpt-4o-mini',
        apiKeySet: settings?.aiApiKeySet ?? false,
        usesEnvKey: !settings?.aiApiKeySet && Boolean(getEnvApiKey(providerId)),
      },
      supportedProviders: getAllProviderDescriptors(),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to fetch AI settings', details: getErrorMessage(error) },
      { status: 500 }
    );
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
    const user = await getCurrentUser(await headers());
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.aiEnabled === 'boolean') {
      updateData.aiEnabled = body.aiEnabled;
    }

    if (body.providerId !== undefined) {
      const descriptor = getProviderDescriptor(body.providerId);
      if (!descriptor) {
        return NextResponse.json({ error: 'Invalid AI provider' }, { status: 400 });
      }
      updateData.aiProviderId = body.providerId;

      // Auto-set default model if provider changes and no explicit model is given
      if (!body.model) {
        updateData.aiModel = descriptor.defaultModel;
      }
    }

    if (body.model) {
      updateData.aiModel = body.model;
    }

    // API key handling
    if (body.apiKey && typeof body.apiKey === 'string' && body.apiKey.trim().length > 0) {
      updateData.aiApiKeyEncrypted = encryptAiApiKey(body.apiKey.trim());
      updateData.aiApiKeySet = true;
    }

    if (body.clearApiKey === true) {
      updateData.aiApiKeyEncrypted = null;
      updateData.aiApiKeySet = false;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      settings: {
        aiEnabled: settings.aiEnabled,
        providerId: settings.aiProviderId,
        model: settings.aiModel,
        apiKeySet: settings.aiApiKeySet,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to update AI settings', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
