import { NextRequest, NextResponse } from 'next/server';

import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { fetchFullBody, resolveAiContext } from '@/lib/services/ai-context';

/**
 * POST /api/ai/summarize
 *
 * Fetches the full body of the given message on-demand and returns a
 * 1-3 bullet point summary. The body is never persisted.
 *
 * Body: { messageId: string }
 *
 * Privacy: Requires allowFullBodyFetch and allowExternalAi to be enabled.
 */
export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveAiContext();
    if ('error' in resolved) return resolved.error;

    const { context } = resolved;
    const { messageId } = await req.json();

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
    }

    // Verify the message belongs to the user
    const email = await prisma.emailMetadata.findFirst({
      where: { messageId, userId: context.userId },
    });
    if (!email) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Fetch full body on demand - never cached/persisted
    const body = await fetchFullBody(context.gmailService, messageId);

    if (!body || body.trim().length === 0) {
      return NextResponse.json({ summary: 'No text content found in this email.' });
    }

    const summary = await context.aiService.summarize(body);

    // Log activity (no output stored by default)
    await prisma.activityLog.create({
      data: {
        userId: context.userId,
        action: 'AI_SUMMARIZE',
        description: `Summarized email: ${email.subject}`,
        metadata: context.settings.allowAiOutputStorage
          ? JSON.stringify({ messageId, summaryLength: typeof summary === 'string' ? summary.length : 0 })
          : null,
      },
    });

    return NextResponse.json({
      summary,
      metadata: {
        messageId,
        subject: email.subject,
        provider: context.settings.aiProviderId,
        transient: !context.settings.allowAiOutputStorage,
      },
    });
  } catch (error: unknown) {
    console.error('Summarize Error:', error);
    return NextResponse.json({ error: 'Failed to summarize email', details: getErrorMessage(error) }, { status: 500 });
  }
}
