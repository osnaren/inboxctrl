import { getProviderDescriptor, type AiProviderId } from '@inboxctrl/ai';

import type { ActionType } from '@/lib/services/action-engine';

import { ApiRouteError, apiError } from './contracts';

import type { GmailPermissionModeId } from '@inboxctrl/core';
import type { Prisma, UserSettings } from '@inboxctrl/db';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getRequiredString = (value: unknown, fieldName: string) => {
  const stringValue = getOptionalString(value);
  if (!stringValue) {
    throw apiError(400, 'INVALID_REQUEST', `Missing ${fieldName}`);
  }

  return stringValue;
};

const getOptionalBoolean = (value: unknown) => (typeof value === 'boolean' ? value : undefined);

export const parseStoredLabelIds = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((label): label is string => typeof label === 'string') : [];
  } catch {
    return [];
  }
};

export interface MailListQuery {
  label?: string;
  sender?: string;
  query?: string;
  unread: boolean;
  starred: boolean;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export const parseMailListQuery = (searchParams: URLSearchParams): MailListQuery => ({
  label: getOptionalString(searchParams.get('label')),
  sender: getOptionalString(searchParams.get('sender')),
  query: getOptionalString(searchParams.get('q')),
  unread: searchParams.get('unread') === 'true',
  starred: searchParams.get('starred') === 'true',
  page: Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1),
  pageSize: Math.min(200, Math.max(1, Number.parseInt(searchParams.get('pageSize') || '50', 10) || 50)),
  sortBy: getOptionalString(searchParams.get('sortBy')) ?? 'date',
  sortDir: searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc',
});

export const buildMailListWhere = (userId: string, query: MailListQuery): Prisma.EmailMetadataWhereInput => {
  const where: Prisma.EmailMetadataWhereInput = { userId };

  if (query.unread) where.isUnread = true;
  if (query.starred) where.isStarred = true;

  if (query.sender) {
    where.OR = [{ sender: { contains: query.sender } }, { from: { contains: query.sender } }];
  }

  if (query.label) {
    where.labelIds = { contains: JSON.stringify(query.label) };
  }

  if (query.query) {
    const textSearch: Prisma.EmailMetadataWhereInput[] = [
      { from: { contains: query.query } },
      { to: { contains: query.query } },
      { subject: { contains: query.query } },
      { snippet: { contains: query.query } },
    ];

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: textSearch }];
      delete where.OR;
    } else {
      where.OR = textSearch;
    }
  }

  return where;
};

export const buildMailListOrderBy = (query: MailListQuery): Prisma.EmailMetadataOrderByWithRelationInput => {
  const orderByMap: Record<string, Prisma.EmailMetadataOrderByWithRelationInput> = {
    date: { date: query.sortDir },
    from: { from: query.sortDir },
    subject: { subject: query.sortDir },
  };

  return orderByMap[query.sortBy] || { date: query.sortDir };
};

export const formatMailListEmail = <
  T extends {
    date: Date;
    labelIds: string;
  },
>(
  email: T
) => ({
  ...email,
  labelIds: parseStoredLabelIds(email.labelIds),
  formattedDate: new Date(email.date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
});

export const VALID_BULK_ACTIONS: ActionType[] = [
  'archive',
  'trash',
  'mark-read',
  'mark-unread',
  'star',
  'unstar',
  'apply-label',
  'remove-label',
];

export interface ParsedBulkActionRequest {
  messageIds: string[];
  action: ActionType;
  labelId?: string;
}

export const parseBulkActionRequest = (body: unknown): ParsedBulkActionRequest => {
  if (!isRecord(body)) {
    throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }

  const messageIds = Array.isArray(body.messageIds)
    ? body.messageIds.filter(
        (messageId): messageId is string => typeof messageId === 'string' && messageId.trim().length > 0
      )
    : [];

  if (messageIds.length === 0) {
    throw apiError(400, 'INVALID_REQUEST', 'Missing or invalid messageIds array');
  }

  if (!VALID_BULK_ACTIONS.includes(body.action as ActionType)) {
    throw apiError(400, 'INVALID_REQUEST', `Invalid action. Must be one of: ${VALID_BULK_ACTIONS.join(', ')}`);
  }

  const action = body.action as ActionType;
  const labelId = getOptionalString(body.labelId);

  if ((action === 'apply-label' || action === 'remove-label') && !labelId) {
    throw apiError(400, 'INVALID_REQUEST', `Missing labelId for '${action}' action`);
  }

  return {
    messageIds,
    action,
    ...(labelId ? { labelId } : {}),
  };
};

export interface ParsedFilterRequest {
  prompt: string;
  dryRun: boolean;
}

export const parseFilterRequest = (body: unknown): ParsedFilterRequest => {
  if (!isRecord(body)) {
    throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }

  return {
    prompt: getRequiredString(body.prompt, 'prompt'),
    dryRun: body.dryRun === true,
  };
};

export const parsePermissionUpgradeRequest = (body: unknown): { mode: GmailPermissionModeId } => {
  if (!isRecord(body)) {
    throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }

  const mode = body.mode;
  const validModes: GmailPermissionModeId[] = ['read-only-audit', 'organizer', 'settings-filter'];
  if (!validModes.includes(mode as GmailPermissionModeId)) {
    throw apiError(400, 'INVALID_REQUEST', 'Invalid permission mode', {
      validModes,
    });
  }

  return { mode: mode as GmailPermissionModeId };
};

export const parseCreateLabelRequest = (body: unknown) => {
  if (!isRecord(body)) {
    throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }

  return {
    name: getRequiredString(body.name, 'label name'),
    backgroundColor: getOptionalString(body.backgroundColor),
    textColor: getOptionalString(body.textColor),
  };
};

export const parseUpdateLabelRequest = (body: unknown) => {
  if (!isRecord(body)) {
    throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }

  return {
    id: getRequiredString(body.id, 'label id'),
    name: getRequiredString(body.name, 'label name'),
    backgroundColor: getOptionalString(body.backgroundColor),
    textColor: getOptionalString(body.textColor),
  };
};

export const parseDeleteLabelRequest = (body: unknown) => {
  if (!isRecord(body)) {
    throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }

  return {
    id: getRequiredString(body.id, 'label id'),
  };
};

export const DEFAULT_PRIVACY_SETTINGS = {
  allowExternalAi: false,
  allowFullBodyFetch: false,
  allowDestructiveActions: false,
  requireBulkConfirmation: true,
  allowAiOutputStorage: false,
  metadataCacheRetentionDays: 90,
  activityLogRetentionDays: 365,
} as const;

type PrivacySettingsShape = Pick<
  UserSettings,
  | 'allowExternalAi'
  | 'allowFullBodyFetch'
  | 'allowDestructiveActions'
  | 'requireBulkConfirmation'
  | 'allowAiOutputStorage'
  | 'metadataCacheRetentionDays'
  | 'activityLogRetentionDays'
>;

export const formatPrivacySettings = (settings: PrivacySettingsShape | null | undefined) => ({
  allowExternalAi: settings?.allowExternalAi ?? DEFAULT_PRIVACY_SETTINGS.allowExternalAi,
  allowFullBodyFetch: settings?.allowFullBodyFetch ?? DEFAULT_PRIVACY_SETTINGS.allowFullBodyFetch,
  allowDestructiveActions: settings?.allowDestructiveActions ?? DEFAULT_PRIVACY_SETTINGS.allowDestructiveActions,
  requireBulkConfirmation: settings?.requireBulkConfirmation ?? DEFAULT_PRIVACY_SETTINGS.requireBulkConfirmation,
  allowAiOutputStorage: settings?.allowAiOutputStorage ?? DEFAULT_PRIVACY_SETTINGS.allowAiOutputStorage,
  metadataCacheRetentionDays:
    settings?.metadataCacheRetentionDays ?? DEFAULT_PRIVACY_SETTINGS.metadataCacheRetentionDays,
  activityLogRetentionDays: settings?.activityLogRetentionDays ?? DEFAULT_PRIVACY_SETTINGS.activityLogRetentionDays,
});

export const parsePrivacySettingsUpdate = (body: unknown) => {
  if (!isRecord(body)) {
    throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }

  const updateData: Record<string, unknown> = {};
  const boolFields = [
    'allowExternalAi',
    'allowFullBodyFetch',
    'allowDestructiveActions',
    'requireBulkConfirmation',
    'allowAiOutputStorage',
  ] as const;

  for (const field of boolFields) {
    const value = getOptionalBoolean(body[field]);
    if (value !== undefined) {
      updateData[field] = value;
    }
  }

  const parseRetentionDays = (field: 'metadataCacheRetentionDays' | 'activityLogRetentionDays') => {
    if (body[field] === undefined) return;

    const days = Number(body[field]);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      throw apiError(400, 'INVALID_REQUEST', `${field} must be between 1 and 3650`);
    }

    updateData[field] = days;
  };

  parseRetentionDays('metadataCacheRetentionDays');
  parseRetentionDays('activityLogRetentionDays');

  if (Object.keys(updateData).length === 0) {
    throw apiError(400, 'INVALID_REQUEST', 'No valid settings provided');
  }

  return updateData;
};

type AiSettingsShape = Pick<UserSettings, 'aiEnabled' | 'aiProviderId' | 'aiModel' | 'aiApiKeySet'>;

export const formatAiSettings = (settings: AiSettingsShape | null | undefined, usesEnvKey: boolean) => {
  const providerId = (settings?.aiProviderId ?? 'openai') as AiProviderId;

  return {
    aiEnabled: settings?.aiEnabled ?? false,
    providerId,
    model: settings?.aiModel ?? getProviderDescriptor(providerId)?.defaultModel ?? 'gpt-4o-mini',
    apiKeySet: settings?.aiApiKeySet ?? false,
    usesEnvKey,
  };
};

export interface ParsedAiSettingsUpdate {
  updateData: Record<string, unknown>;
  apiKey?: string;
}

export const parseAiSettingsUpdate = (body: unknown): ParsedAiSettingsUpdate => {
  if (!isRecord(body)) {
    throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
  }

  const updateData: Record<string, unknown> = {};

  const aiEnabled = getOptionalBoolean(body.aiEnabled);
  if (aiEnabled !== undefined) {
    updateData.aiEnabled = aiEnabled;
  }

  const providerId = getOptionalString(body.providerId);
  if (providerId) {
    const descriptor = getProviderDescriptor(providerId);
    if (!descriptor) {
      throw apiError(400, 'INVALID_REQUEST', 'Invalid AI provider');
    }

    updateData.aiProviderId = providerId;
    if (!getOptionalString(body.model)) {
      updateData.aiModel = descriptor.defaultModel;
    }
  }

  const model = getOptionalString(body.model);
  if (model) {
    updateData.aiModel = model;
  }

  const apiKey = getOptionalString(body.apiKey);

  if (body.clearApiKey === true) {
    updateData.aiApiKeyEncrypted = null;
    updateData.aiApiKeySet = false;
  }

  if (!apiKey && Object.keys(updateData).length === 0) {
    throw apiError(400, 'INVALID_REQUEST', 'No valid settings provided');
  }

  return {
    updateData,
    ...(apiKey ? { apiKey } : {}),
  };
};

export const parseJsonObject = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body = await request.json();
    if (!isRecord(body)) {
      throw apiError(400, 'INVALID_REQUEST', 'Request body must be a JSON object');
    }

    return body;
  } catch (error) {
    if (error instanceof ApiRouteError) {
      throw error;
    }

    throw apiError(400, 'INVALID_REQUEST', 'Request body must be valid JSON');
  }
};
