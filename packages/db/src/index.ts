// Types & contracts
export type {
  Account,
  AccountRecord,
  AccountRepository,
  ActivityLogCreateData,
  ActivityLogRecord,
  ActivityLogRepository,
  ActionBatch,
  ActionBatchRecord,
  EmailFilterQuery,
  EmailRecord,
  EmailRepository,
  EmailUpsertData,
  FilterDraft,
  FilterDraftRecord,
  LabelRecord,
  LabelRepository,
  LabelUpsertData,
  SessionRecord,
  SyncStateRepository,
  SyncState,
  SyncStateRecord,
  UserRecord,
  UserSettings,
  UserSettingsRecord,
  Prisma,
} from './types';

export { createPrismaClient, PrismaClient } from './types';
export { currentDatabaseProfile, currentPrismaAdapterProvider } from './profile';
export type { DatabaseProfile, PrismaAdapterProvider } from './profile';

// Repository implementations
export { PrismaAccountRepository } from './repositories/account';
export { PrismaEmailRepository } from './repositories/email';
export { PrismaLabelRepository } from './repositories/label';
export { PrismaActivityLogRepository } from './repositories/activity-log';
