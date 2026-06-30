import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import {
  handleApiRouteError,
  jsonApiSuccess,
  requireAuthenticatedUser,
  throwPermissionFailure,
} from '@/lib/api/contracts';
import { GmailService } from '@/lib/services/gmail.service';
import { MailSyncService } from '@/lib/services/mail-sync.service';
import { getCurrentUser } from '@/lib/session-user';

export async function POST(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));
    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'read-only-audit');
    const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);

    const gmailService = new GmailService(accessToken);
    const result = await new MailSyncService().syncUserMailbox(user.id, gmailService);

    return jsonApiSuccess({
      success: true,
      count: result.syncedMessages,
      syncedLabels: result.syncedLabels,
      syncedMessages: result.syncedMessages,
    });
  } catch (error: unknown) {
    console.error('Sync API Error:', error);
    return handleApiRouteError(error, {
      code: 'MAIL_SYNC_FAILED',
      message: 'Failed to sync mailbox metadata',
    });
  }
}
