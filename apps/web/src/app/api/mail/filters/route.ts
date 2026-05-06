import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { AIService } from '@/lib/services/ai.service';
import { DBService } from '@/lib/services/db.service';
import { GmailService } from '@/lib/services/gmail.service';

import type { Prisma } from '@prisma/client';
import type { gmail_v1 } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, dryRun = false } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const db = new DBService();
    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

    const userLabels = await db.getUserLabels(session.user.id);
    const validLabelNames = userLabels.map((l) => l.name);

    const aiService = new AIService();
    const filterData = await aiService.naturalLanguageToFilter(prompt, validLabelNames);

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
      return NextResponse.json({ error: 'No valid actions could be parsed from prompt.' }, { status: 400 });
    }

    if (dryRun) {
      const permission = await requireGoogleAccountPermission(session.user.id, requestHeaders, 'read-only-audit');
      if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

      const conditions: Prisma.EmailMetadataWhereInput[] = [{ userId: session.user.id }];
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

      return NextResponse.json({
        success: true,
        isDryRun: true,
        parsedAiData: filterData,
        dryRunResults: {
          totalMatched: totalMatchCount,
          samples: matchedEmails,
        },
      });
    }

    const permission = await requireGoogleAccountPermission(session.user.id, requestHeaders, 'settings-filter');
    if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

    const gmailService = new GmailService(permission.accessToken);
    const createdFilter = await gmailService.createFilter(filterData.criteria, actionPayload);

    return NextResponse.json({ success: true, filter: createdFilter, parsedAiData: filterData });
  } catch (error: unknown) {
    console.error('Filter API Error:', error);
    return NextResponse.json({ error: 'Failed to create filter', details: getErrorMessage(error) }, { status: 500 });
  }
}
