import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { AIService } from '@/lib/services/ai.service';
import { DBService } from '@/lib/services/db.service';

export async function POST(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = new DBService();
    const emailsToTriage = await db.getUnreadEmails(session.user.id, 10);

    if (emailsToTriage.length === 0) {
      return NextResponse.json({ triageResults: [], message: 'No unread emails to triage.' });
    }

    const userLabels = await db.getUserLabels(session.user.id);
    const validLabelNames = userLabels.map((l) => l.name);

    const promptEmails = emailsToTriage.map((e) => ({
      id: e.messageId,
      from: e.from,
      subject: e.subject,
      snippet: e.snippet,
    }));

    const aiService = new AIService();
    const suggestions = await aiService.triageEmails(promptEmails, validLabelNames);

    return NextResponse.json({ triageResults: suggestions });
  } catch (error: unknown) {
    console.error('Triage Error:', error);
    return NextResponse.json({ error: 'Failed to triage emails', details: getErrorMessage(error) }, { status: 500 });
  }
}
