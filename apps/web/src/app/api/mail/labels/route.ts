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
import {
  parseCreateLabelRequest,
  parseDeleteLabelRequest,
  parseJsonObject,
  parseUpdateLabelRequest,
} from '@/lib/api/launch-contracts';
import { prisma } from '@/lib/prisma';
import { DBService } from '@/lib/services/db.service';
import { GmailService } from '@/lib/services/gmail.service';
import { getCurrentUser } from '@/lib/session-user';

export async function GET(_req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));

    const db = new DBService();
    const labels = await db.getUserLabels(user.id);

    return jsonApiSuccess({ labels });
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'MAIL_LABELS_FETCH_FAILED',
      message: 'Failed to fetch labels',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));
    const body = await parseJsonObject(req);
    const { name, backgroundColor, textColor } = parseCreateLabelRequest(body);

    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'settings-filter');
    const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);

    const gmailService = new GmailService(accessToken);
    const newRemoteLabel = await gmailService.createLabel(name, backgroundColor, textColor);

    if (newRemoteLabel.id && newRemoteLabel.name) {
      const savedLabel = await prisma.label.create({
        data: {
          gmailId: newRemoteLabel.id,
          userId: user.id,
          name: newRemoteLabel.name,
          type: 'user',
          color: backgroundColor || null,
        },
      });
      return jsonApiSuccess({ label: savedLabel }, { status: 201 });
    }

    throw apiError(502, 'GMAIL_LABEL_CREATE_FAILED', 'Failed to create label remotely');
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'MAIL_LABEL_CREATE_FAILED',
      message: 'Failed to create label',
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));
    const body = await parseJsonObject(req);
    const { id } = parseDeleteLabelRequest(body);

    const label = await prisma.label.findFirst({
      where: { id, userId: user.id },
    });

    if (!label) {
      throw apiError(404, 'MAIL_LABEL_NOT_FOUND', 'Label not found');
    }

    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'settings-filter');
    const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);

    const gmailService = new GmailService(accessToken);
    await gmailService.deleteLabel(label.gmailId);

    await prisma.label.delete({ where: { id } });

    return jsonApiSuccess({ success: true });
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'MAIL_LABEL_DELETE_FAILED',
      message: 'Failed to delete label',
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));
    const body = await parseJsonObject(req);
    const { id, name, backgroundColor, textColor } = parseUpdateLabelRequest(body);

    const label = await prisma.label.findFirst({
      where: { id, userId: user.id },
    });

    if (!label) {
      throw apiError(404, 'MAIL_LABEL_NOT_FOUND', 'Label not found');
    }

    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'settings-filter');
    const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);

    const gmailService = new GmailService(accessToken);
    const updatedRemoteLabel = await gmailService.updateLabel(label.gmailId, name, backgroundColor, textColor);

    if (updatedRemoteLabel.id && updatedRemoteLabel.name) {
      const updatedLabel = await prisma.label.update({
        where: { id },
        data: {
          name: updatedRemoteLabel.name,
          color: backgroundColor || null,
        },
      });
      return jsonApiSuccess({ label: updatedLabel });
    }

    throw apiError(502, 'GMAIL_LABEL_UPDATE_FAILED', 'Failed to update label remotely');
  } catch (error: unknown) {
    return handleApiRouteError(error, {
      code: 'MAIL_LABEL_UPDATE_FAILED',
      message: 'Failed to update label',
    });
  }
}
