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
import { prisma } from '@/lib/prisma';
import { ActionEngine } from '@/lib/services/action-engine';
import { GmailService } from '@/lib/services/gmail.service';
import { getCurrentUser } from '@/lib/session-user';

export async function POST(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));

    const { id } = await props.params;
    if (!id) {
      throw apiError(400, 'INVALID_REQUEST', 'Missing activity ID');
    }

    const log = await prisma.activityLog.findFirst({
      where: { id, userId: user.id },
    });

    if (!log) {
      throw apiError(404, 'ACTIVITY_LOG_NOT_FOUND', 'Log not found');
    }
    if (log.isRolledBack) {
      throw apiError(400, 'ACTIVITY_LOG_ALREADY_ROLLED_BACK', 'Already rolled back');
    }
    if (!log.metadata) {
      throw apiError(400, 'ACTIVITY_LOG_NO_ROLLBACK_DATA', 'No rollback metadata available');
    }

    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'organizer');
    const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);

    const gmailService = new GmailService(accessToken);
    const engine = new ActionEngine(gmailService, user.id);
    const rollback = await engine.rollback(id);
    const updatedLog = await prisma.activityLog.findUnique({ where: { id } });

    return jsonApiSuccess({
      success: rollback.success,
      reversedCount: rollback.reversedCount,
      log: updatedLog,
    });
  } catch (error: unknown) {
    console.error('Rollback Error:', error);
    return handleApiRouteError(error, {
      code: 'MAIL_ROLLBACK_FAILED',
      message: 'Failed to rollback activity',
    });
  }
}
