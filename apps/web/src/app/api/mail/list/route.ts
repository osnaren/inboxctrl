import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session-user';

import type { Prisma } from '@prisma/client';

/**
 * GET /api/mail/list
 *
 * Serves mailbox views from cached metadata. Supports filtering by label,
 * sender, unread status, and free-text search. All queries hit the local
 * SQLite cache - no Gmail API calls are made.
 *
 * Query params:
 *   label    - Filter by label ID (appears in JSON labelIds array)
 *   sender   - Filter by sender email address (exact or partial match)
 *   q        - Free-text search across from, to, subject, snippet
 *   unread   - "true" to show only unread emails
 *   starred  - "true" to show only starred emails
 *   page     - Page number (1-based, default 1)
 *   pageSize - Results per page (default 50, max 200)
 *   sortBy   - "date" (default) | "from" | "subject"
 *   sortDir  - "desc" (default) | "asc"
 */
export async function GET(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const currentUser = await getCurrentUser(requestHeaders);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const { searchParams } = req.nextUrl;

    // Parse query params
    const label = searchParams.get('label');
    const sender = searchParams.get('sender');
    const query = searchParams.get('q');
    const unread = searchParams.get('unread') === 'true';
    const starred = searchParams.get('starred') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: Prisma.EmailMetadataWhereInput = { userId };

    if (unread) where.isUnread = true;
    if (starred) where.isStarred = true;

    if (sender) {
      where.OR = [{ sender: { contains: sender } }, { from: { contains: sender } }];
    }

    if (label) {
      where.labelIds = { contains: JSON.stringify(label) };
    }

    if (query) {
      const textSearch: Prisma.EmailMetadataWhereInput[] = [
        { from: { contains: query } },
        { to: { contains: query } },
        { subject: { contains: query } },
        { snippet: { contains: query } },
      ];
      // Combine with existing OR conditions
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: textSearch }];
        delete where.OR;
      } else {
        where.OR = textSearch;
      }
    }

    // Build orderBy
    const orderByMap: Record<string, Prisma.EmailMetadataOrderByWithRelationInput> = {
      date: { date: sortDir },
      from: { from: sortDir },
      subject: { subject: sortDir },
    };
    const orderBy = orderByMap[sortBy] || { date: sortDir };

    // Execute query
    const [emails, totalCount] = await Promise.all([
      prisma.emailMetadata.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.emailMetadata.count({ where }),
    ]);

    // Get last sync time for cache freshness
    const cacheUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSyncAt: true },
    });

    // Parse labels and format
    const formattedEmails = emails.map((email) => ({
      ...email,
      labelIds: parseLabelIds(email.labelIds),
      formattedDate: new Date(email.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    }));

    return NextResponse.json({
      emails: formattedEmails,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
      cache: {
        lastSyncAt: cacheUser?.lastSyncAt?.toISOString() ?? null,
        stale: cacheUser?.lastSyncAt
          ? Date.now() - cacheUser.lastSyncAt.getTime() > 5 * 60 * 1000 // stale if > 5 min
          : true,
      },
    });
  } catch (error: unknown) {
    console.error('List API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch emails', details: getErrorMessage(error) }, { status: 500 });
  }
}

function parseLabelIds(value: string): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((label): label is string => typeof label === 'string') : [];
  } catch {
    return [];
  }
}
