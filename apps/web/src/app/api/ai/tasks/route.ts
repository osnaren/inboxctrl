import { NextRequest, NextResponse } from 'next/server';

import { demoAi } from '@inboxctrl/demo-data';

import { isDemoMode } from '@/lib/demo-mode';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { fetchFullBody, resolveAiContext } from '@/lib/services/ai-context';

/**
 * POST /api/ai/extract-tasks
 *
 * Fetches the full body of the given message on-demand and extracts structured
 * tasks with due dates and requester when detectable.
 *
 * Body: { messageId: string }
 *
 * Privacy: Requires allowFullBodyFetch and allowExternalAi.
 */
export async function POST(req: NextRequest) {
  try {
    const { messageId } = await req.json();

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
    }

    if (isDemoMode()) {
      return NextResponse.json({
        tasks: demoAi.tasks[messageId as keyof typeof demoAi.tasks] ?? [],
        metadata: {
          messageId,
          provider: 'demo',
          transient: true,
          demoMode: true,
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
      return NextResponse.json({ tasks: [], message: 'No text content found.' });
    }

    const taskResult = await context.aiService.extractTasks(body);

    await prisma.activityLog.create({
      data: {
        userId: context.userId,
        action: 'AI_EXTRACT_TASKS',
        description: `Extracted tasks from: ${email.subject}`,
        metadata: context.settings.allowAiOutputStorage
          ? JSON.stringify({ messageId, taskCount: taskResult.tasks.length })
          : null,
      },
    });

    return NextResponse.json({
      tasks: taskResult.tasks,
      metadata: {
        messageId,
        subject: email.subject,
        from: email.from,
        provider: context.settings.aiProviderId,
        transient: !context.settings.allowAiOutputStorage,
      },
    });
  } catch (error: unknown) {
    console.error('Extract Tasks Error:', error);
    return NextResponse.json({ error: 'Failed to extract tasks', details: getErrorMessage(error) }, { status: 500 });
  }
}
