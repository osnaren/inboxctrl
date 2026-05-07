import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { AiService } from '@inboxctrl/ai';

import { decryptAiApiKey, getEnvApiKey } from '@/lib/ai-secrets';
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
    const user = await getCurrentUser(await headers());
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (isDemoMode()) {
      return NextResponse.json({
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
      return NextResponse.json({ error: 'AI is not enabled. Enable AI in settings first.' }, { status: 400 });
    }

    // Determine API key: BYOK > env
    let apiKey: string | undefined;
    if (settings.aiApiKeySet && settings.aiApiKeyEncrypted) {
      apiKey = decryptAiApiKey(settings.aiApiKeyEncrypted);
    } else {
      apiKey = getEnvApiKey(settings.aiProviderId);
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured. Set a BYOK key or provide OPENAI_API_KEY in environment.' },
        { status: 400 }
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

      return NextResponse.json({
        success: true,
        provider: settings.aiProviderId,
        model: settings.aiModel,
        latencyMs,
        response: typeof result === 'string' ? result.substring(0, 200) : 'OK',
      });
    } catch (aiError) {
      const latencyMs = Date.now() - startTime;
      return NextResponse.json(
        {
          success: false,
          provider: settings.aiProviderId,
          model: settings.aiModel,
          latencyMs,
          error: getErrorMessage(aiError),
        },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to test AI connection', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
