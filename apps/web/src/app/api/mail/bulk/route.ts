import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import {
  apiError,
  handleApiRouteError,
  jsonApiSuccess,
  requireAuthenticatedUser,
  throwPermissionFailure,
} from '@/lib/api/contracts';
import { parseBulkActionRequest, parseJsonObject } from '@/lib/api/launch-contracts';
import { prisma } from '@/lib/prisma';
import { ActionEngine } from '@/lib/services/action-engine';
import { GmailService } from '@/lib/services/gmail.service';
import { getCurrentUser } from '@/lib/session-user';

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));
    const body = await parseJsonObject(req);
    const { messageIds, action, labelId } = parseBulkActionRequest(body);

    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'organizer');
    const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);

    // Validate that all messageIds belong to the current user
    const userEmails = await prisma.emailMetadata.findMany({
      where: {
        userId: user.id,
        messageId: { in: messageIds },
      },
      select: { messageId: true },
    });

    const validMessageIds = userEmails.map((e) => e.messageId);
    if (validMessageIds.length !== messageIds.length) {
      throw apiError(403, 'MAIL_MESSAGES_UNAUTHORIZED', 'One or more messages not found or unauthorized');
    }

    if ((action === 'apply-label' || action === 'remove-label') && labelId) {
      const label = await prisma.label.findFirst({
        where: { userId: user.id, gmailId: labelId },
        select: { gmailId: true },
      });

      if (!label) {
        throw apiError(403, 'MAIL_LABEL_UNAUTHORIZED', 'Label not found or unauthorized');
      }
    }

    const gmailService = new GmailService(accessToken);
    const engine = new ActionEngine(gmailService, user.id);

    // Safety check for destructive actions
    const safetyCheck = await engine.checkSafety(action);
    if (!safetyCheck.allowed) {
      throw apiError(403, 'DESTRUCTIVE_ACTION_DISABLED', safetyCheck.reason ?? 'Action is not allowed');
    }

    const result = await engine.execute({ messageIds, action, labelId });
    const actionBatch = await prisma.actionBatch.create({
      data: {
        userId: user.id,
        action,
        labelId: labelId ?? null,
        messageIdsJson: JSON.stringify(messageIds),
        totalCount: result.total,
        processedCount: result.processed,
        failedCount: result.failed,
        activityLogId: result.activityLogId,
      },
    });

    return jsonApiSuccess({
      success: result.success,
      processed: result.processed,
      failed: result.failed,
      total: result.total,
      activityLogId: result.activityLogId,
      actionBatchId: actionBatch.id,
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
    return handleApiRouteError(error, {
      code: 'MAIL_BULK_ACTION_FAILED',
      message: 'Failed to perform bulk action',
    });
  }
}
