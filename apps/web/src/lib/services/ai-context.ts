import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { AiService } from '@inboxctrl/ai';
import { GMAIL_SCOPES, hasGmailScopeAccess } from '@inboxctrl/core';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import { decryptAiApiKey, getEnvApiKey } from '@/lib/ai-secrets';
import { prisma } from '@/lib/prisma';
import { GmailService } from '@/lib/services/gmail.service';
import { getCurrentUser } from '@/lib/session-user';

/**
 * Shared helpers for AI endpoints that need full body access.
 * Enforces privacy checks and resolves the AI service.
 */

export interface AiRequestContext {
  userId: string;
  aiService: AiService;
  gmailService: GmailService;
  settings: {
    allowAiOutputStorage: boolean;
    aiProviderId: string;
    aiModel: string;
  };
}

/**
 * Resolves and validates AI context: session, privacy settings, AI config, Gmail access.
 * Returns either the context or an error NextResponse.
 */
export async function resolveAiContext(): Promise<{ context: AiRequestContext } | { error: NextResponse }> {
  const requestHeaders = await headers();
  const user = await getCurrentUser(requestHeaders);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (!settings?.aiEnabled) {
    return { error: NextResponse.json({ error: 'AI is not enabled. Enable AI in settings.' }, { status: 400 }) };
  }

  if (!settings.allowExternalAi) {
    return {
      error: NextResponse.json(
        { error: 'External AI processing is disabled. Enable in Privacy settings.' },
        { status: 403 }
      ),
    };
  }

  if (!settings.allowFullBodyFetch) {
    return {
      error: NextResponse.json(
        {
          error: 'Full email body access is disabled. Enable "Allow full body fetch for AI" in Privacy settings.',
          code: 'FULL_BODY_DISABLED',
        },
        { status: 403 }
      ),
    };
  }

  // Resolve API key
  let apiKey: string | undefined;
  if (settings.aiApiKeySet && settings.aiApiKeyEncrypted) {
    apiKey = decryptAiApiKey(settings.aiApiKeyEncrypted);
  } else {
    apiKey = getEnvApiKey(settings.aiProviderId);
  }

  if (!apiKey) {
    return { error: NextResponse.json({ error: 'No AI API key configured' }, { status: 400 }) };
  }

  // Gmail access for fetching full body
  const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'read-only-audit');
  if (!permission.ok) {
    return { error: NextResponse.json(permission.body, { status: permission.status }) };
  }

  if (!hasGmailScopeAccess(permission.token.scopes, GMAIL_SCOPES.readonly)) {
    return {
      error: NextResponse.json(
        {
          error: 'Gmail readonly access is required for full-body AI features',
          missingScopes: [GMAIL_SCOPES.readonly],
        },
        { status: 403 }
      ),
    };
  }

  const aiService = new AiService({
    config: {
      providerId: settings.aiProviderId,
      model: settings.aiModel,
      apiKey,
    },
  });

  const gmailService = new GmailService(permission.accessToken);

  return {
    context: {
      userId: user.id,
      aiService,
      gmailService,
      settings: {
        allowAiOutputStorage: settings.allowAiOutputStorage,
        aiProviderId: settings.aiProviderId,
        aiModel: settings.aiModel,
      },
    },
  };
}

/**
 * Fetch the full text body of a message via Gmail API (on-demand, not cached).
 */
export async function fetchFullBody(gmailService: GmailService, messageId: string): Promise<string> {
  const fullMsg = await gmailService.getMessageFull(messageId);
  if (!fullMsg || !fullMsg.payload) {
    throw new Error(`Could not fetch full body for message ${messageId}`);
  }
  return gmailService.extractTextBody(fullMsg.payload) || '';
}
