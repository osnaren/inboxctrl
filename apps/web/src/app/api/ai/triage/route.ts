import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { decryptAiApiKey, getEnvApiKey } from '@/lib/ai-secrets';
import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { AIService } from '@/lib/services/ai.service';
import { DBService } from '@/lib/services/db.service';

export async function POST(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings?.aiEnabled) {
      return NextResponse.json({ error: 'AI is not enabled. Enable AI in settings first.' }, { status: 400 });
    }

    if (!settings.allowExternalAi) {
      return NextResponse.json(
        { error: 'External AI processing is disabled. Enable in Privacy settings.' },
        { status: 403 }
      );
    }

    const apiKey =
      settings.aiApiKeySet && settings.aiApiKeyEncrypted
        ? decryptAiApiKey(settings.aiApiKeyEncrypted)
        : getEnvApiKey(settings.aiProviderId);

    if (!apiKey) {
      return NextResponse.json({ error: 'No AI API key configured' }, { status: 400 });
    }

    const db = new DBService();
    const emailsToTriage = await db.getUnreadEmails(session.user.id, 10);

    if (emailsToTriage.length === 0) {
      return NextResponse.json({ triageResults: [], message: 'No unread emails to triage.' });
    }

    const userLabels = await db.getUserLabels(session.user.id);
    const validLabelNames = userLabels.map((l) => l.name);

    const promptEmails = emailsToTriage.map((e) => ({
      id: e.messageId,
      from: e.from,
      subject: e.subject,
      snippet: e.snippet,
    }));

    const aiService = new AIService({
      config: {
        providerId: settings.aiProviderId,
        model: settings.aiModel,
        apiKey,
      },
    });
    const suggestions = await aiService.triageEmails(promptEmails, validLabelNames);

    return NextResponse.json({ triageResults: suggestions });
  } catch (error: unknown) {
    console.error('Triage Error:', error);
    return NextResponse.json({ error: 'Failed to triage emails', details: getErrorMessage(error) }, { status: 500 });
  }
}
