import { demoEmails, demoLabels } from '@inboxctrl/demo-data';

import type { GmailFilterInfo, GmailLabelInfo, GmailMessageFull, GmailMessageMeta } from '@inboxctrl/gmail';
import type { gmail_v1 } from 'googleapis';

interface DemoMessage {
  messageId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  sender: string;
  date: string;
  isUnread: boolean;
  isStarred: boolean;
  hasAttach: boolean;
  labelIds: string[];
  body: string;
}

const cloneLabels = (): GmailLabelInfo[] =>
  demoLabels.map((label) => ({
    id: label.gmailId,
    name: label.name,
    type: label.type,
    color: label.color,
  }));

const cloneMessages = (): DemoMessage[] =>
  demoEmails.map((message) => ({
    ...message,
    labelIds: [...message.labelIds],
  }));

let labels = cloneLabels();
let messages = cloneMessages();
let filters: GmailFilterInfo[] = [];

const toHeaderPayload = (message: DemoMessage) => [
  { name: 'From', value: message.from },
  { name: 'To', value: message.to },
  { name: 'Subject', value: message.subject },
  { name: 'Date', value: message.date },
];

const toMetadata = (message: DemoMessage): GmailMessageMeta => ({
  id: message.messageId,
  threadId: message.threadId,
  labelIds: [...message.labelIds],
  snippet: message.snippet,
  internalDate: String(new Date(message.date).getTime()),
  headers: {
    from: message.from,
    to: message.to,
    subject: message.subject,
    date: message.date,
  },
});

const encodeBody = (body: string) => Buffer.from(body, 'utf-8').toString('base64url');

export class DemoGmailService {
  async listMessages({ maxResults = 50, labelIds }: { maxResults?: number; labelIds?: string[] } = {}) {
    const filtered = messages.filter((message) =>
      labelIds?.length ? labelIds.every((labelId) => message.labelIds.includes(labelId)) : true
    );

    return {
      messages: filtered.slice(0, maxResults).map((message) => ({
        id: message.messageId,
        threadId: message.threadId,
      })),
      nextPageToken: null,
      resultSizeEstimate: filtered.length,
    };
  }

  async listRecentMessages(maxResults = 50, labelIds = ['INBOX']) {
    const result = await this.listMessages({ maxResults, labelIds });
    return result.messages;
  }

  async getMessageMetadata(messageId: string) {
    const message = messages.find((candidate) => candidate.messageId === messageId);
    if (!message) throw new Error(`Demo message not found: ${messageId}`);
    return toMetadata(message);
  }

  async getMessageFull(messageId: string): Promise<GmailMessageFull> {
    const message = messages.find((candidate) => candidate.messageId === messageId);
    if (!message) throw new Error(`Demo message not found: ${messageId}`);

    return {
      ...toMetadata(message),
      payload: {
        mimeType: 'text/plain',
        headers: toHeaderPayload(message),
        body: { data: encodeBody(message.body) },
      } satisfies gmail_v1.Schema$MessagePart,
      sizeEstimate: message.body.length,
      raw: null,
    };
  }

  async listLabels(): Promise<GmailLabelInfo[]> {
    return labels.map((label) => ({ ...label }));
  }

  async createLabel({
    backgroundColor,
    name,
  }: {
    name: string;
    backgroundColor?: string;
    textColor?: string;
  }): Promise<GmailLabelInfo> {
    const id = `Label_demo_${
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || 'custom'
    }`;
    const label = { id, name, type: 'user', color: backgroundColor ?? '#dff4ef' };
    labels = [...labels.filter((candidate) => candidate.id !== id), label];
    return label;
  }

  async updateLabel({
    backgroundColor,
    labelId,
    name,
  }: {
    labelId: string;
    name: string;
    backgroundColor?: string;
    textColor?: string;
  }): Promise<GmailLabelInfo> {
    const existing = labels.find((label) => label.id === labelId);
    const updated = {
      id: labelId,
      name,
      type: existing?.type ?? 'user',
      color: backgroundColor ?? existing?.color ?? '#dff4ef',
    };
    labels = labels.map((label) => (label.id === labelId ? updated : label));
    return updated;
  }

  async deleteLabel(labelId: string) {
    labels = labels.filter((label) => label.id !== labelId);
    messages = messages.map((message) => ({
      ...message,
      labelIds: message.labelIds.filter((candidate) => candidate !== labelId),
    }));
  }

  async modifyMessageLabels({
    addLabelIds = [],
    messageId,
    removeLabelIds = [],
  }: {
    messageId: string;
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }) {
    messages = messages.map((message) => {
      if (message.messageId !== messageId) return message;

      const nextLabels = new Set(message.labelIds);
      for (const labelId of removeLabelIds) nextLabels.delete(labelId);
      for (const labelId of addLabelIds) nextLabels.add(labelId);

      return {
        ...message,
        labelIds: [...nextLabels],
      };
    });
  }

  async trashMessage(messageId: string) {
    await this.modifyMessageLabels({ messageId, addLabelIds: ['TRASH'], removeLabelIds: ['INBOX'] });
  }

  async listFilters(): Promise<GmailFilterInfo[]> {
    return filters.map((filter) => ({ ...filter }));
  }

  async createFilter({
    action,
    criteria,
  }: {
    criteria: gmail_v1.Schema$FilterCriteria;
    action: gmail_v1.Schema$FilterAction;
  }): Promise<GmailFilterInfo> {
    const filter = {
      id: `demo-filter-${filters.length + 1}`,
      criteria,
      action,
    };
    filters = [...filters, filter];
    return filter;
  }

  async deleteFilter(filterId: string) {
    filters = filters.filter((filter) => filter.id !== filterId);
  }
}
