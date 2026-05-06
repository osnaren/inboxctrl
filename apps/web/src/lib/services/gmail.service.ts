import { headers } from 'next/headers';

import { google, gmail_v1 } from 'googleapis';

import { getGoogleAccessTokenForAccount } from '@/lib/accounts';

type AuthRequestHeaders = Awaited<ReturnType<typeof headers>>;

export class GmailService {
  private gmail: gmail_v1.Gmail;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  static async forUser(userId: string, requestHeaders: AuthRequestHeaders) {
    const googleAccess = await getGoogleAccessTokenForAccount(userId, requestHeaders);
    if (!googleAccess) return null;

    return new GmailService(googleAccess.accessToken);
  }

  // --- MESSAGES ---

  async listRecentMessages(maxResults = 50, labelIds = ['INBOX']) {
    const res = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds,
    });
    return res.data.messages || [];
  }

  async getMessageMetadata(messageId: string) {
    const res = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date'],
    });
    return res.data;
  }

  async getMessageFull(messageId: string) {
    const res = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    return res.data;
  }

  extractTextBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    let textBody = '';
    if (payload?.parts) {
      const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
      if (textPart && textPart.body?.data) {
        textBody = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    } else if (payload?.body?.data) {
      textBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    return textBody;
  }

  extractHeaders(headers: gmail_v1.Schema$MessagePartHeader[] | undefined) {
    const result = { from: '', to: '', subject: '', date: '' };
    if (!headers) return result;
    for (const header of headers) {
      const name = header.name?.toLowerCase();
      if (name === 'from') result.from = header.value || '';
      if (name === 'to') result.to = header.value || '';
      if (name === 'subject') result.subject = header.value || '';
      if (name === 'date') result.date = header.value || '';
    }
    return result;
  }

  // --- LABELS ---

  async listLabels() {
    const res = await this.gmail.users.labels.list({ userId: 'me' });
    return res.data.labels || [];
  }

  async createLabel(name: string, backgroundColor?: string, textColor?: string) {
    const labelData: gmail_v1.Schema$Label = {
      name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    };

    if (backgroundColor && textColor) {
      labelData.color = { backgroundColor, textColor };
    }

    const res = await this.gmail.users.labels.create({
      userId: 'me',
      requestBody: labelData,
    });
    return res.data;
  }

  async updateLabel(labelId: string, name: string, backgroundColor?: string, textColor?: string) {
    const labelData: gmail_v1.Schema$Label = {
      id: labelId,
      name,
    };

    if (backgroundColor && textColor) {
      labelData.color = { backgroundColor, textColor };
    }

    const res = await this.gmail.users.labels.patch({
      userId: 'me',
      id: labelId,
      requestBody: labelData,
    });
    return res.data;
  }

  async deleteLabel(labelId: string) {
    await this.gmail.users.labels.delete({
      userId: 'me',
      id: labelId,
    });
    return true;
  }

  async modifyMessageLabels(messageId: string, addLabelIds: string[] = [], removeLabelIds: string[] = []) {
    const res = await this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds,
        removeLabelIds,
      },
    });
    return res.data;
  }

  async trashMessage(messageId: string) {
    const res = await this.gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });
    return res.data;
  }

  // --- FILTERS ---

  async listFilters() {
    const res = await this.gmail.users.settings.filters.list({ userId: 'me' });
    return res.data.filter || [];
  }

  async createFilter(criteria: gmail_v1.Schema$FilterCriteria, action: gmail_v1.Schema$FilterAction) {
    const res = await this.gmail.users.settings.filters.create({
      userId: 'me',
      requestBody: {
        criteria,
        action,
      },
    });
    return res.data;
  }

  async deleteFilter(filterId: string) {
    await this.gmail.users.settings.filters.delete({
      userId: 'me',
      id: filterId,
    });
    return true;
  }
}
