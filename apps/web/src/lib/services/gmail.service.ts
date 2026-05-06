/**
 * App-layer Gmail service - thin wrapper that composes @inboxctrl/gmail
 * with app-specific concerns (session, request headers, account lookup).
 *
 * This wrapper also provides backwards-compatible method signatures so
 * existing route handlers don't need to change their call sites.
 */
import { headers } from 'next/headers';

import { GmailClient, type GmailLabelInfo } from '@inboxctrl/gmail';

import { getGoogleAccessTokenForAccount } from '@/lib/accounts';

import type { gmail_v1 } from 'googleapis';

type AuthRequestHeaders = Awaited<ReturnType<typeof headers>>;

export class GmailService {
  private client: GmailClient;

  constructor(accessToken: string) {
    this.client = new GmailClient({ accessToken });
  }

  /**
   * Create a GmailService for the given user's primary Google account.
   */
  static async forUser(userId: string, requestHeaders: AuthRequestHeaders) {
    const googleAccess = await getGoogleAccessTokenForAccount(userId, requestHeaders);
    if (!googleAccess) return null;

    return new GmailService(googleAccess.accessToken);
  }

  // --- MESSAGES (backwards-compatible signatures) ---

  async listRecentMessages(maxResults = 50, labelIds = ['INBOX']) {
    const result = await this.client.listMessages({ maxResults, labelIds });
    return result.messages;
  }

  async getMessageMetadata(messageId: string) {
    return this.client.getMessageMetadata(messageId);
  }

  async getMessageFull(messageId: string) {
    return this.client.getMessageFull(messageId);
  }

  extractHeaders(headers: gmail_v1.Schema$MessagePartHeader[] | undefined) {
    return GmailClient.extractHeaders(headers);
  }

  extractTextBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    return GmailClient.extractTextBody(payload);
  }

  // --- LABELS (backwards-compatible signatures) ---

  async listLabels(): Promise<GmailLabelInfo[]> {
    return this.client.listLabels();
  }

  async createLabel(name: string, backgroundColor?: string, textColor?: string) {
    return this.client.createLabel({ name, backgroundColor, textColor });
  }

  async updateLabel(labelId: string, name: string, backgroundColor?: string, textColor?: string) {
    return this.client.updateLabel({ labelId, name, backgroundColor, textColor });
  }

  async deleteLabel(labelId: string) {
    return this.client.deleteLabel(labelId);
  }

  // --- MESSAGE MODIFICATION (backwards-compatible signatures) ---

  async modifyMessageLabels(messageId: string, addLabelIds: string[] = [], removeLabelIds: string[] = []) {
    return this.client.modifyMessageLabels({ messageId, addLabelIds, removeLabelIds });
  }

  async trashMessage(messageId: string) {
    return this.client.trashMessage(messageId);
  }

  // --- FILTERS (backwards-compatible signatures) ---

  async listFilters() {
    return this.client.listFilters();
  }

  async createFilter(criteria: gmail_v1.Schema$FilterCriteria, action: gmail_v1.Schema$FilterAction) {
    return this.client.createFilter({ criteria, action });
  }

  async deleteFilter(filterId: string) {
    return this.client.deleteFilter(filterId);
  }
}
