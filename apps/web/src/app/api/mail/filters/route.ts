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
import { parseFilterRequest, parseJsonObject } from '@/lib/api/launch-contracts';
import { isDemoMode } from '@/lib/demo-mode';
import { prisma } from '@/lib/prisma';
import { AIService } from '@/lib/services/ai.service';
import { DBService } from '@/lib/services/db.service';
import { GmailService } from '@/lib/services/gmail.service';
import { getCurrentUser } from '@/lib/session-user';

import type { Prisma } from '@inboxctrl/db';
import type { gmail_v1 } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const user = requireAuthenticatedUser(await getCurrentUser(requestHeaders));
    const body = await parseJsonObject(req);
    const { prompt, dryRun } = parseFilterRequest(body);

    const db = new DBService();

    const userLabels = await db.getUserLabels(user.id);
    const validLabelNames = userLabels.map((l) => l.name);

    const filterData = isDemoMode()
      ? {
          criteria: { from: prompt.toLowerCase().includes('github') ? 'github.com' : undefined },
          action: { addLabelIds: [validLabelNames[0] ?? 'Receipts'] },
        }
      : await new AIService().naturalLanguageToFilter(prompt, validLabelNames);

    const addLabelIds: string[] = [];
    const removeLabelIds: string[] = filterData.action.removeLabelIds || [];

    if (filterData.action.addLabelIds) {
      for (const labelName of filterData.action.addLabelIds) {
        const found = userLabels.find((l) => l.name.toLowerCase() === labelName.toLowerCase());
        if (found) addLabelIds.push(found.gmailId);
      }
    }

    const actionPayload: gmail_v1.Schema$FilterAction = {};
    if (addLabelIds.length > 0) actionPayload.addLabelIds = addLabelIds;
    if (removeLabelIds.length > 0) actionPayload.removeLabelIds = removeLabelIds;
    if (filterData.action.forward) actionPayload.forward = filterData.action.forward;

    if (Object.keys(actionPayload).length === 0) {
      throw apiError(400, 'INVALID_REQUEST', 'No valid actions could be parsed from prompt.');
    }

    if (dryRun) {
      const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'read-only-audit');
      if (!permission.ok) {
        throwPermissionFailure(permission);
      }

      const conditions: Prisma.EmailMetadataWhereInput[] = [{ userId: user.id }];
      if (filterData.criteria.from) {
        conditions.push({ from: { contains: filterData.criteria.from } });
      }
      if (filterData.criteria.to) {
        conditions.push({ to: { contains: filterData.criteria.to } });
      }
      if (filterData.criteria.subject) {
        conditions.push({ subject: { contains: filterData.criteria.subject } });
      }

      const matchedEmails = await prisma.emailMetadata.findMany({
        where: { AND: conditions },
        take: 20,
        orderBy: { date: 'desc' },
      });

      const totalMatchCount = await prisma.emailMetadata.count({
        where: { AND: conditions },
      });

      const filterDraft = await prisma.filterDraft.create({
        data: {
          userId: user.id,
          prompt,
          criteriaJson: JSON.stringify(filterData.criteria ?? {}),
          actionJson: JSON.stringify(filterData.action ?? {}),
          dryRun: true,
          matchedCount: totalMatchCount,
        },
      });

      return jsonApiSuccess({
        success: true,
        isDryRun: true,
        parsedAiData: filterData,
        dryRunResults: {
          totalMatched: totalMatchCount,
          samples: matchedEmails,
        },
        draftId: filterDraft.id,
      });
    }

    const permission = await requireGoogleAccountPermission(user.id, requestHeaders, 'settings-filter');
    const accessToken = permission.ok ? permission.accessToken : throwPermissionFailure(permission);

    const gmailService = new GmailService(accessToken);
    const createdFilter = await gmailService.createFilter(filterData.criteria, actionPayload);
    const filterDraft = await prisma.filterDraft.create({
      data: {
        userId: user.id,
        prompt,
        criteriaJson: JSON.stringify(filterData.criteria ?? {}),
        actionJson: JSON.stringify(filterData.action ?? {}),
        dryRun: false,
        matchedCount: null,
        filterId: createdFilter.id ?? null,
      },
    });

    return jsonApiSuccess({
      success: true,
      filter: createdFilter,
      parsedAiData: filterData,
      draftId: filterDraft.id,
    });
  } catch (error: unknown) {
    console.error('Filter API Error:', error);
    return handleApiRouteError(error, {
      code: 'MAIL_FILTER_CREATE_FAILED',
      message: 'Failed to create filter',
    });
  }
}
