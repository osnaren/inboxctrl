import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { handleApiRouteError, jsonApiSuccess, requireAuthenticatedUser } from '@/lib/api/contracts';
import {
  buildMailListOrderBy,
  buildMailListWhere,
  formatMailListEmail,
  parseMailListQuery,
} from '@/lib/api/launch-contracts';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session-user';

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
    const currentUser = requireAuthenticatedUser(await getCurrentUser(requestHeaders));
    const mailQuery = parseMailListQuery(req.nextUrl.searchParams);
    const where = buildMailListWhere(currentUser.id, mailQuery);
    const orderBy = buildMailListOrderBy(mailQuery);

    // Execute query
    const [emails, totalCount] = await Promise.all([
      prisma.emailMetadata.findMany({
        where,
        orderBy,
        skip: (mailQuery.page - 1) * mailQuery.pageSize,
        take: mailQuery.pageSize,
      }),
      prisma.emailMetadata.count({ where }),
    ]);

    // Get last sync time for cache freshness
    const cacheUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { lastSyncAt: true },
    });

    // Parse labels and format
    const formattedEmails = emails.map(formatMailListEmail);

    return jsonApiSuccess({
      emails: formattedEmails,
      pagination: {
        page: mailQuery.page,
        pageSize: mailQuery.pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / mailQuery.pageSize),
        hasMore: mailQuery.page * mailQuery.pageSize < totalCount,
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
    return handleApiRouteError(error, {
      code: 'MAIL_LIST_FETCH_FAILED',
      message: 'Failed to fetch emails',
    });
  }
}
