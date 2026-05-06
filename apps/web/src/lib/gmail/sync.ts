import { prisma } from '@/lib/prisma';

import { getGmailClient, extractHeaders } from './client';

export async function fetchAndSyncRecentEmails(accessToken: string, userId: string, maxResults = 50) {
  const gmail = await getGmailClient(accessToken);

  try {
    // 1. Fetch a list of recent message IDs
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'], // Start with Inbox
    });

    const messages = listRes.data.messages;
    if (!messages || messages.length === 0) {
      return [];
    }

    const syncedEmails = [];

    // 2. Fetch full details for each message and sync to DB
    // Note: Doing this in a loop can hit rate limits if maxResults is high.
    // For large batches, consider Promise.all with a concurrency limiter or batching.
    for (const msg of messages) {
      if (!msg.id) continue;

      // Check if we already have this email in the database
      const existing = await prisma.emailMetadata.findUnique({
        where: { messageId: msg.id },
      });

      if (existing) {
        syncedEmails.push(existing);
        continue;
      }

      // If not, fetch from Gmail API
      const msgRes = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata', // Only get headers to save bandwidth/time
        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
      });

      const data = msgRes.data;
      const headers = extractHeaders(data.payload?.headers || []);

      const labelIdsStr = JSON.stringify(data.labelIds || []);

      // Ensure we have a valid date for SQLite
      let parsedDate = new Date();
      if (headers.date) {
        const d = new Date(headers.date);
        if (!isNaN(d.getTime())) {
          parsedDate = d;
        }
      }

      // Save to database
      const savedEmail = await prisma.emailMetadata.create({
        data: {
          messageId: data.id as string,
          threadId: data.threadId as string,
          userId: userId,
          from: headers.from,
          to: headers.to,
          subject: headers.subject,
          snippet: data.snippet || '',
          date: parsedDate,
          isUnread: (data.labelIds || []).includes('UNREAD'),
          isStarred: (data.labelIds || []).includes('STARRED'),
          labelIds: labelIdsStr, // SQLite workaround
        },
      });

      syncedEmails.push(savedEmail);
    }

    return syncedEmails;
  } catch (error) {
    console.error('Error syncing emails:', error);
    throw error;
  }
}
