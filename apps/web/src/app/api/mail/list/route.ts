import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch emails from local DB cache
    const emails = await prisma.emailMetadata.findMany({
      where: { userId: userId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    // Parse the SQLite JSON string back to arrays for the frontend
    const formattedEmails = emails.map((email) => ({
      ...email,
      labelIds: JSON.parse(email.labelIds || '[]'),
      // Format date for UI
      formattedDate: new Date(email.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    }));

    return NextResponse.json({ emails: formattedEmails });
  } catch (error: unknown) {
    console.error('List API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch emails', details: getErrorMessage(error) }, { status: 500 });
  }
}
