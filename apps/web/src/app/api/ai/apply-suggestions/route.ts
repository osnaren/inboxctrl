import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { ActionEngine } from '@/lib/services/action-engine';
import { GmailService } from '@/lib/services/gmail.service';

/**
 * POST /api/ai/apply-suggestions
 *
 * Applies accepted label suggestions via the action engine.
 * No auto-apply in OSS alpha - each suggestion must be explicitly accepted.
 *
 * Body: {
 *   suggestions: Array<{
 *     messageId: string;
 *     labelId: string;
 *   }>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { suggestions } = await req.json();
    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json({ error: 'Missing or empty suggestions array' }, { status: 400 });
    }

    // Validate suggestion shape
    for (const s of suggestions) {
      if (!s.messageId || !s.labelId) {
        return NextResponse.json({ error: 'Each suggestion must have messageId and labelId' }, { status: 400 });
      }
    }

    const requestedMessageIds = [...new Set(suggestions.map((s) => s.messageId))];
    const requestedLabelIds = [...new Set(suggestions.map((s) => s.labelId))];

    const [emails, labels] = await Promise.all([
      prisma.emailMetadata.findMany({
        where: { userId: session.user.id, messageId: { in: requestedMessageIds } },
        select: { messageId: true },
      }),
      prisma.label.findMany({
        where: { userId: session.user.id, gmailId: { in: requestedLabelIds } },
        select: { gmailId: true },
      }),
    ]);

    if (emails.length !== requestedMessageIds.length) {
      return NextResponse.json({ error: 'One or more messages not found or unauthorized' }, { status: 403 });
    }

    if (labels.length !== requestedLabelIds.length) {
      return NextResponse.json({ error: 'One or more labels not found or unauthorized' }, { status: 403 });
    }

    const permission = await requireGoogleAccountPermission(session.user.id, requestHeaders, 'organizer');
    if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

    const gmailService = new GmailService(permission.accessToken);
    const engine = new ActionEngine(gmailService, session.user.id);

    // Group by labelId to batch apply
    const byLabel = new Map<string, string[]>();
    for (const s of suggestions) {
      const arr = byLabel.get(s.labelId) || [];
      arr.push(s.messageId);
      byLabel.set(s.labelId, arr);
    }

    const results = [];
    for (const [labelId, messageIds] of byLabel) {
      const result = await engine.execute({
        messageIds,
        action: 'apply-label',
        labelId,
      });
      results.push({ labelId, ...result });
    }

    const totalApplied = results.reduce((sum, r) => sum + r.processed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    // Record activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'AI_SUGGESTION_APPLIED',
        description: `Applied ${totalApplied} AI-suggested label${totalApplied !== 1 ? 's' : ''}${totalFailed > 0 ? ` (${totalFailed} failed)` : ''}`,
        metadata: JSON.stringify({
          acceptedCount: suggestions.length,
          appliedCount: totalApplied,
        }),
      },
    });

    return NextResponse.json({
      success: totalFailed === 0,
      applied: totalApplied,
      failed: totalFailed,
      results,
    });
  } catch (error: unknown) {
    console.error('Apply Suggestions Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply suggestions', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
