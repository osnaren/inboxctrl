import { google, type gmail_v1 } from 'googleapis';

import { GmailApiError, normalizeGmailError } from './errors';

import type {
  BatchModifyLabelsOptions,
  CreateFilterOptions,
  CreateLabelOptions,
  GmailClientOptions,
  GmailFilterInfo,
  GmailHeaders,
  GmailLabelInfo,
  GmailMessageFull,
  GmailMessageMeta,
  ListMessagesOptions,
  ListMessagesResult,
  ModifyLabelsOptions,
  UpdateLabelOptions,
} from './types';

/**
 * Framework-agnostic Gmail API client.
 *
 * Wraps the googleapis `gmail_v1.Gmail` object and provides typed helper
 * methods for every operation InboxCtrl needs.  The class is intentionally free
 * of Prisma, Next.js, or any app-layer dependency so it can live in a
 * standalone workspace package.
 *
 * ## Token refresh
 *
 * Pass an `onTokenRefresh` callback in the constructor options to enable
 * automatic retry on 401 responses.  The callback should return a fresh access
 * token or `null` if renewal is impossible.
 */
export class GmailClient {
  private gmail: gmail_v1.Gmail;
  private accessToken: string;
  private readonly onTokenRefresh?: () => Promise<string | null>;

  constructor(options: GmailClientOptions) {
    this.accessToken = options.accessToken;
    this.onTokenRefresh = options.onTokenRefresh;

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: this.accessToken });

    this.gmail = google.gmail({ version: 'v1', auth });
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /**
   * Wrap an API call with automatic 401 retry when a refresh callback exists.
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const gmailError = normalizeGmailError(error);

      if (gmailError.isAuthError && gmailError.code === 401 && this.onTokenRefresh) {
        const newToken = await this.onTokenRefresh();
        if (newToken) {
          this.accessToken = newToken;
          const auth = new google.auth.OAuth2();
          auth.setCredentials({ access_token: newToken });
          this.gmail = google.gmail({ version: 'v1', auth });
          return fn();
        }
      }

      throw gmailError;
    }
  }

  // -----------------------------------------------------------------------
  // Header parsing
  // -----------------------------------------------------------------------

  /**
   * Parse From / To / Subject / Date from a Gmail message header array.
   */
  static extractHeaders(headers?: gmail_v1.Schema$MessagePartHeader[]): GmailHeaders {
    const result: GmailHeaders = { from: '', to: '', subject: '', date: '' };
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

  /**
   * Extract the plain-text body from a full message payload.
   */
  static extractTextBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      return GmailClient.decodeBodyData(payload.body.data);
    }

    for (const part of payload.parts ?? []) {
      const text = GmailClient.extractTextBody(part);
      if (text) return text;
    }

    if (payload.body?.data && !payload.parts?.length) {
      return GmailClient.decodeBodyData(payload.body.data);
    }

    return '';
  }

  private static decodeBodyData(data: string): string {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  }

  // -----------------------------------------------------------------------
  // Messages
  // -----------------------------------------------------------------------

  async listMessages(options: ListMessagesOptions = {}): Promise<ListMessagesResult> {
    return this.withRetry(async () => {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: options.maxResults ?? 50,
        labelIds: options.labelIds,
        q: options.query,
        pageToken: options.pageToken,
      });

      return {
        messages: (res.data.messages || []).map((m) => ({
          id: m.id!,
          threadId: m.threadId!,
        })),
        nextPageToken: res.data.nextPageToken ?? null,
        resultSizeEstimate: res.data.resultSizeEstimate ?? 0,
      };
    });
  }

  async getMessageMetadata(messageId: string): Promise<GmailMessageMeta> {
    return this.withRetry(async () => {
      const res = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
      });

      const data = res.data;
      return {
        id: data.id!,
        threadId: data.threadId!,
        labelIds: data.labelIds || [],
        snippet: data.snippet || '',
        headers: GmailClient.extractHeaders(data.payload?.headers),
        internalDate: data.internalDate ?? null,
      };
    });
  }

  async getMessageFull(messageId: string): Promise<GmailMessageFull> {
    return this.withRetry(async () => {
      const res = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const data = res.data;
      return {
        id: data.id!,
        threadId: data.threadId!,
        labelIds: data.labelIds || [],
        snippet: data.snippet || '',
        headers: GmailClient.extractHeaders(data.payload?.headers),
        internalDate: data.internalDate ?? null,
        payload: data.payload ?? null,
        sizeEstimate: data.sizeEstimate ?? 0,
        raw: data.raw ?? null,
      };
    });
  }

  // -----------------------------------------------------------------------
  // Message modification
  // -----------------------------------------------------------------------

  async modifyMessageLabels(options: ModifyLabelsOptions): Promise<void> {
    await this.withRetry(async () => {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: options.messageId,
        requestBody: {
          addLabelIds: options.addLabelIds ?? [],
          removeLabelIds: options.removeLabelIds ?? [],
        },
      });
    });
  }

  async batchModifyLabels(options: BatchModifyLabelsOptions): Promise<void> {
    await this.withRetry(async () => {
      await this.gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: options.messageIds,
          addLabelIds: options.addLabelIds ?? [],
          removeLabelIds: options.removeLabelIds ?? [],
        },
      });
    });
  }

  async trashMessage(messageId: string): Promise<void> {
    await this.withRetry(async () => {
      await this.gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      });
    });
  }

  async markRead(messageId: string): Promise<void> {
    await this.modifyMessageLabels({
      messageId,
      removeLabelIds: ['UNREAD'],
    });
  }

  async markUnread(messageId: string): Promise<void> {
    await this.modifyMessageLabels({
      messageId,
      addLabelIds: ['UNREAD'],
    });
  }

  async star(messageId: string): Promise<void> {
    await this.modifyMessageLabels({
      messageId,
      addLabelIds: ['STARRED'],
    });
  }

  async unstar(messageId: string): Promise<void> {
    await this.modifyMessageLabels({
      messageId,
      removeLabelIds: ['STARRED'],
    });
  }

  async archive(messageId: string): Promise<void> {
    await this.modifyMessageLabels({
      messageId,
      removeLabelIds: ['INBOX'],
    });
  }

  // -----------------------------------------------------------------------
  // Labels
  // -----------------------------------------------------------------------

  async listLabels(): Promise<GmailLabelInfo[]> {
    return this.withRetry(async () => {
      const res = await this.gmail.users.labels.list({ userId: 'me' });
      return (res.data.labels || []).map((label) => ({
        id: label.id!,
        name: label.name!,
        type: label.type || 'system',
        color: label.color?.backgroundColor || null,
        messagesTotal: label.messagesTotal ?? undefined,
        messagesUnread: label.messagesUnread ?? undefined,
      }));
    });
  }

  async createLabel(options: CreateLabelOptions): Promise<GmailLabelInfo> {
    return this.withRetry(async () => {
      const labelData: gmail_v1.Schema$Label = {
        name: options.name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      };

      if (options.backgroundColor && options.textColor) {
        labelData.color = {
          backgroundColor: options.backgroundColor,
          textColor: options.textColor,
        };
      }

      const res = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: labelData,
      });

      const data = res.data;
      return {
        id: data.id!,
        name: data.name!,
        type: data.type || 'user',
        color: data.color?.backgroundColor || null,
      };
    });
  }

  async updateLabel(options: UpdateLabelOptions): Promise<GmailLabelInfo> {
    return this.withRetry(async () => {
      const labelData: gmail_v1.Schema$Label = {
        id: options.labelId,
        name: options.name,
      };

      if (options.backgroundColor && options.textColor) {
        labelData.color = {
          backgroundColor: options.backgroundColor,
          textColor: options.textColor,
        };
      }

      const res = await this.gmail.users.labels.patch({
        userId: 'me',
        id: options.labelId,
        requestBody: labelData,
      });

      const data = res.data;
      return {
        id: data.id!,
        name: data.name!,
        type: data.type || 'user',
        color: data.color?.backgroundColor || null,
      };
    });
  }

  async deleteLabel(labelId: string): Promise<void> {
    await this.withRetry(async () => {
      await this.gmail.users.labels.delete({
        userId: 'me',
        id: labelId,
      });
    });
  }

  // -----------------------------------------------------------------------
  // Filters
  // -----------------------------------------------------------------------

  async listFilters(): Promise<GmailFilterInfo[]> {
    return this.withRetry(async () => {
      const res = await this.gmail.users.settings.filters.list({ userId: 'me' });
      return (res.data.filter || []).map((f) => ({
        id: f.id!,
        criteria: f.criteria || {},
        action: f.action || {},
      }));
    });
  }

  async createFilter(options: CreateFilterOptions): Promise<GmailFilterInfo> {
    return this.withRetry(async () => {
      const res = await this.gmail.users.settings.filters.create({
        userId: 'me',
        requestBody: {
          criteria: options.criteria,
          action: options.action,
        },
      });

      const data = res.data;
      return {
        id: data.id!,
        criteria: data.criteria || {},
        action: data.action || {},
      };
    });
  }

  async deleteFilter(filterId: string): Promise<void> {
    await this.withRetry(async () => {
      await this.gmail.users.settings.filters.delete({
        userId: 'me',
        id: filterId,
      });
    });
  }
}
