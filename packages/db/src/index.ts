// Types & contracts
export type {
  AccountRecord,
  AccountRepository,
  ActivityLogCreateData,
  ActivityLogRecord,
  ActivityLogRepository,
  EmailFilterQuery,
  EmailRecord,
  EmailRepository,
  EmailUpsertData,
  LabelRecord,
  LabelRepository,
  LabelUpsertData,
  SessionRecord,
  SyncStateRepository,
  UserRecord,
} from './types';

export { createPrismaClient } from './types';

// Repository implementations
export { PrismaAccountRepository } from './repositories/account';
export { PrismaEmailRepository } from './repositories/email';
export { PrismaLabelRepository } from './repositories/label';
export { PrismaActivityLogRepository } from './repositories/activity-log';
