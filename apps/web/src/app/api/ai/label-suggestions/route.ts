import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { AiService } from '@inboxctrl/ai';
import { demoAi } from '@inboxctrl/demo-data';

import { decryptAiApiKey, getEnvApiKey } from '@/lib/ai-secrets';
import { isDemoMode } from '@/lib/demo-mode';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session-user';

/**
 * POST /api/ai/label-suggestions
 *
 * Accepts selected message IDs and sends only minimal context (subject, from,
 * snippet - never full body) to the AI provider to generate label suggestions.
 *
 * Body: { messageIds: string[] }
 *
 * Returns an array of suggestions, each with:
 *   - messageId
 *   - suggestedLabel / labelId
 *   - confidence: number (0-1)
 *   - explanation: string
 */
export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = await getCurrentUser(requestHeaders);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageIds } = await req.json();
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid messageIds array' }, { status: 400 });
    }

    if (messageIds.length > 25) {
      return NextResponse.json({ error: 'Maximum 25 messages per request' }, { status: 400 });
    }

    if (isDemoMode()) {
      const requestedMessageIds = [...new Set(messageIds.filter((id): id is string => typeof id === 'string'))];
      const suggestions = demoAi.labelSuggestions
        .filter((suggestion) => requestedMessageIds.includes(suggestion.messageId))
        .map((suggestion) => ({
          ...suggestion,
          labelId: `Label_${suggestion.suggestedLabel.toLowerCase()}`,
          labelName: suggestion.suggestedLabel,
        }));

      return NextResponse.json({
        suggestions,
        metadata: {
          processedCount: requestedMessageIds.length,
          availableLabels: ['Receipts', 'GitHub', 'Travel'],
          provider: 'demo',
          transient: true,
          demoMode: true,
        },
      });
    }

    // Check AI settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
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

    const requestedMessageIds = [...new Set(messageIds.filter((id): id is string => typeof id === 'string'))];
    if (requestedMessageIds.length !== messageIds.length) {
      return NextResponse.json({ error: 'messageIds must be strings' }, { status: 400 });
    }

    // Fetch minimal metadata for the requested messages (never full body)
    const emails = await prisma.emailMetadata.findMany({
      where: {
        userId: user.id,
        messageId: { in: requestedMessageIds },
      },
      select: {
        messageId: true,
        from: true,
        subject: true,
        snippet: true,
      },
    });

    if (emails.length !== requestedMessageIds.length) {
      return NextResponse.json({ error: 'One or more messages not found or unauthorized' }, { status: 403 });
    }

    // Get user's current labels for context
    const userLabels = await prisma.label.findMany({
      where: { userId: user.id },
      select: { name: true, gmailId: true },
    });

    const validLabelNames = userLabels.map((l) => l.name);

    // Build AI prompt input - only metadata, never bodies
    const promptEmails = emails.map((e) => ({
      id: e.messageId,
      from: e.from,
      subject: e.subject,
      snippet: e.snippet,
    }));

    // Resolve API key
    let apiKey: string | undefined;
    if (settings.aiApiKeySet && settings.aiApiKeyEncrypted) {
      apiKey = decryptAiApiKey(settings.aiApiKeyEncrypted);
    } else {
      apiKey = getEnvApiKey(settings.aiProviderId);
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No AI API key configured' }, { status: 400 });
    }

    const ai = new AiService({
      config: {
        providerId: settings.aiProviderId,
        model: settings.aiModel,
        apiKey,
      },
    });

    const suggestions = await ai.triageEmails(promptEmails, validLabelNames);
    const labelsByName = new Map(userLabels.map((label) => [label.name.toLowerCase(), label]));
    const normalizedSuggestions = suggestions.map((suggestion) => {
      const label = labelsByName.get(suggestion.suggestedLabel.toLowerCase()) ?? null;
      return {
        ...suggestion,
        labelId: label?.gmailId ?? null,
        labelName: label?.name ?? suggestion.suggestedLabel,
        explanation: suggestion.reasoning,
      };
    });

    // Record AI activity (transient - no output stored unless allowAiOutputStorage)
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'AI_SUGGESTION_GENERATED',
        description: `Generated label suggestions for ${emails.length} email${emails.length !== 1 ? 's' : ''}`,
        metadata: settings.allowAiOutputStorage
          ? JSON.stringify({
              messageIds: emails.map((e) => e.messageId),
              suggestionCount: normalizedSuggestions.length,
            })
          : null,
      },
    });

    return NextResponse.json({
      suggestions: normalizedSuggestions,
      metadata: {
        processedCount: emails.length,
        availableLabels: validLabelNames,
        provider: settings.aiProviderId,
        transient: !settings.allowAiOutputStorage,
      },
    });
  } catch (error: unknown) {
    console.error('Label Suggestions Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate label suggestions', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
