import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { ActionEngine, type ActionType } from '@/lib/services/action-engine';
import { GmailService } from '@/lib/services/gmail.service';

const VALID_ACTIONS: ActionType[] = [
  'archive',
  'trash',
  'mark-read',
  'mark-unread',
  'star',
  'unstar',
  'apply-label',
  'remove-label',
];

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageIds, action, labelId } = await req.json();
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid messageIds array' }, { status: 400 });
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if ((action === 'apply-label' || action === 'remove-label') && !labelId) {
      return NextResponse.json({ error: `Missing labelId for '${action}' action` }, { status: 400 });
    }

    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
    const permission = await requireGoogleAccountPermission(session.user.id, requestHeaders, 'organizer');
    if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

    // Validate that all messageIds belong to the current user
    const userEmails = await prisma.emailMetadata.findMany({
      where: {
        userId: session.user.id,
        messageId: { in: messageIds },
      },
      select: { messageId: true },
    });

    const validMessageIds = userEmails.map((e) => e.messageId);
    if (validMessageIds.length !== messageIds.length) {
      return NextResponse.json({ error: 'One or more messages not found or unauthorized' }, { status: 403 });
    }

    if ((action === 'apply-label' || action === 'remove-label') && labelId) {
      const label = await prisma.label.findFirst({
        where: { userId: session.user.id, gmailId: labelId },
        select: { gmailId: true },
      });

      if (!label) {
        return NextResponse.json({ error: 'Label not found or unauthorized' }, { status: 403 });
      }
    }

    const gmailService = new GmailService(permission.accessToken);
    const engine = new ActionEngine(gmailService, session.user.id);

    // Safety check for destructive actions
    const safetyCheck = await engine.checkSafety(action);
    if (!safetyCheck.allowed) {
      return NextResponse.json({ error: safetyCheck.reason, code: 'DESTRUCTIVE_ACTION_DISABLED' }, { status: 403 });
    }

    const result = await engine.execute({ messageIds, action, labelId });

    return NextResponse.json({
      success: result.success,
      processed: result.processed,
      failed: result.failed,
      total: result.total,
      activityLogId: result.activityLogId,
      ...(result.failed > 0 && {
        failures: result.results
          .filter((r) => !r.success)
          .map((r) => ({
            messageId: r.messageId,
            error: r.error,
          })),
      }),
    });
  } catch (error: unknown) {
    console.error('Bulk Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
