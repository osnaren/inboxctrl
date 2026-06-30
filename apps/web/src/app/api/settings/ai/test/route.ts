import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { AiService } from '@inboxctrl/ai';

import { decryptAiApiKey, getEnvApiKey } from '@/lib/ai-secrets';
import { apiError, handleApiRouteError, jsonApiSuccess, requireAuthenticatedUser } from '@/lib/api/contracts';
import { isDemoMode } from '@/lib/demo-mode';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session-user';

/**
 * POST /api/settings/ai/test
 *
 * Validates that the configured AI provider/key works by sending a harmless
 * test prompt. No user data is included in the test. Returns latency and
 * model confirmation.
 */
export async function POST(_req: NextRequest) {
  try {
    const user = requireAuthenticatedUser(await getCurrentUser(await headers()));

    if (isDemoMode()) {
      return jsonApiSuccess({
        success: true,
        provider: 'demo',
        model: 'deterministic-demo',
        latencyMs: 0,
        response: 'OK',
        demoMode: true,
      });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.aiEnabled) {
      throw apiError(400, 'AI_CONFIGURATION_INVALID', 'AI is not enabled. Enable AI in settings first.');
    }

    // Determine API key: BYOK > env
    let apiKey: string | undefined;
    if (settings.aiApiKeySet && settings.aiApiKeyEncrypted) {
      apiKey = decryptAiApiKey(settings.aiApiKeyEncrypted);
    } else {
      apiKey = getEnvApiKey(settings.aiProviderId);
    }

    if (!apiKey) {
      throw apiError(
        400,
        'AI_CONFIGURATION_INVALID',
        'No API key configured. Set a BYOK key or provide OPENAI_API_KEY in environment.'
      );
    }

    const startTime = Date.now();

    try {
      const ai = new AiService({
        config: {
          providerId: settings.aiProviderId,
          model: settings.aiModel,
          apiKey,
        },
      });

      const result = await ai.summarize(
        'This is a test message to validate the AI connection. Please respond with "OK".'
      );
      const latencyMs = Date.now() - startTime;

      return jsonApiSuccess({
        success: true,
        provider: settings.aiProviderId,
        model: settings.aiModel,
        latencyMs,
        response: typeof result === 'string' ? result.substring(0, 200) : 'OK',
      });
    } catch (aiError) {
      throw apiError(502, 'AI_TEST_FAILED', 'Failed to validate AI connection', {
        provider: settings.aiProviderId,
        model: settings.aiModel,
        latencyMs: Date.now() - startTime,
        error: getErrorMessage(aiError),
      });
    }
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'AI_TEST_REQUEST_FAILED',
      message: 'Failed to test AI connection',
    });
  }
}
