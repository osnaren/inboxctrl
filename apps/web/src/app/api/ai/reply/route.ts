import { NextRequest, NextResponse } from 'next/server';

import { demoAi } from '@inboxctrl/demo-data';

import { isDemoMode } from '@/lib/demo-mode';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { fetchFullBody, resolveAiContext } from '@/lib/services/ai-context';

/**
 * POST /api/ai/smart-reply
 *
 * Generates a copyable reply draft from thread context and optional user
 * instruction. No Gmail draft is created in OSS alpha - the text is returned
 * for the user to copy.
 *
 * Body: {
 *   messageId: string;
 *   instruction?: string;  // e.g., "Politely decline the meeting"
 *   tone?: "professional" | "friendly" | "brief";
 * }
 *
 * Privacy: Requires allowFullBodyFetch and allowExternalAi.
 */
export async function POST(req: NextRequest) {
  try {
    const { instruction, messageId, tone } = await req.json();

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
    }

    if (isDemoMode()) {
      return NextResponse.json({
        reply:
          demoAi.smartReplies[messageId as keyof typeof demoAi.smartReplies] ??
          'Thanks for the update. I will review this and follow up shortly.',
        metadata: {
          messageId,
          provider: 'demo',
          transient: true,
          demoMode: true,
          instruction: instruction ?? null,
          tone: tone ?? null,
          note: 'No Gmail draft was created. Copy and paste this reply into your email client.',
        },
      });
    }

    const resolved = await resolveAiContext();
    if ('error' in resolved) return resolved.error;

    const { context } = resolved;

    // Verify ownership
    const email = await prisma.emailMetadata.findFirst({
      where: { messageId, userId: context.userId },
    });
    if (!email) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const body = await fetchFullBody(context.gmailService, messageId);
    if (!body || body.trim().length === 0) {
      return NextResponse.json({ error: 'No text content found in this email' }, { status: 400 });
    }

    // Build smart reply prompt context
    const contextForReply = [`Subject: ${email.subject}`, `From: ${email.from}`, `To: ${email.to}`, '', body].join(
      '\n'
    );

    const replyInstruction = [
      instruction || 'Generate a suitable reply to this email.',
      tone ? `Tone: ${tone}` : '',
      'Keep the reply concise and professional. Do not include a subject line.',
      'Return only the reply text, ready to paste into an email client.',
    ]
      .filter(Boolean)
      .join('\n');

    const reply = await context.aiService.smartReply(contextForReply, replyInstruction);

    await prisma.activityLog.create({
      data: {
        userId: context.userId,
        action: 'AI_SMART_REPLY',
        description: `Generated smart reply for: ${email.subject}`,
        metadata: context.settings.allowAiOutputStorage
          ? JSON.stringify({ messageId, replyLength: typeof reply === 'string' ? reply.length : 0 })
          : null,
      },
    });

    return NextResponse.json({
      reply,
      metadata: {
        messageId,
        subject: email.subject,
        provider: context.settings.aiProviderId,
        transient: !context.settings.allowAiOutputStorage,
        note: 'No Gmail draft was created. Copy and paste this reply into your email client.',
      },
    });
  } catch (error: unknown) {
    console.error('Smart Reply Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate smart reply', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
