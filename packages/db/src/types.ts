import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Repository interfaces
// ---------------------------------------------------------------------------

/**
 * Generic type for entities returned by Prisma - avoids coupling consumers to
 * the exact generated Prisma model types.  The concrete repository methods
 * return `Promise<T | null>` or `Promise<T[]>` as appropriate.
 */

// Re-export commonly used Prisma-generated model shapes as lighter aliases.
// Consumers of @inboxctrl/db depend only on these interfaces.
export type {
  Account as AccountRecord,
  EmailMetadata as EmailRecord,
  Label as LabelRecord,
  ActivityLog as ActivityLogRecord,
  User as UserRecord,
  Session as SessionRecord,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Repository contracts
// ---------------------------------------------------------------------------

export interface AccountRepository {
  findByProvider(userId: string, providerId?: string): Promise<import('@prisma/client').Account | null>;
  findAllByUser(userId: string): Promise<import('@prisma/client').Account[]>;
}

export interface EmailRepository {
  findByMessageId(messageId: string): Promise<import('@prisma/client').EmailMetadata | null>;
  findByUser(userId: string, limit?: number): Promise<import('@prisma/client').EmailMetadata[]>;
  findUnread(userId: string, limit?: number): Promise<import('@prisma/client').EmailMetadata[]>;
  upsertFromSync(data: EmailUpsertData): Promise<import('@prisma/client').EmailMetadata>;
  countByFilter(userId: string, filter: EmailFilterQuery): Promise<number>;
  findByFilter(
    userId: string,
    filter: EmailFilterQuery,
    limit?: number
  ): Promise<import('@prisma/client').EmailMetadata[]>;
}

export interface LabelRepository {
  findByUser(userId: string): Promise<import('@prisma/client').Label[]>;
  findByGmailId(gmailId: string): Promise<import('@prisma/client').Label | null>;
  upsertFromSync(data: LabelUpsertData): Promise<import('@prisma/client').Label>;
  deleteByGmailId(gmailId: string): Promise<void>;
}

export interface ActivityLogRepository {
  create(data: ActivityLogCreateData): Promise<import('@prisma/client').ActivityLog>;
  findByUser(userId: string, limit?: number): Promise<import('@prisma/client').ActivityLog[]>;
  markRolledBack(id: string): Promise<void>;
}

export interface SyncStateRepository {
  getLastSyncTime(userId: string, syncType: string): Promise<Date | null>;
  setLastSyncTime(userId: string, syncType: string, syncedAt: Date): Promise<void>;
}

// ---------------------------------------------------------------------------
// Data transfer shapes
// ---------------------------------------------------------------------------

export interface EmailUpsertData {
  messageId: string;
  threadId: string;
  userId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: Date;
  isUnread: boolean;
  isStarred: boolean;
  hasAttach?: boolean;
  labelIds: string;
}

export interface LabelUpsertData {
  gmailId: string;
  userId: string;
  name: string;
  type: string;
  color: string | null;
}

export interface ActivityLogCreateData {
  userId: string;
  action: string;
  description: string;
  metadata?: string | null;
}

export interface EmailFilterQuery {
  from?: string;
  to?: string;
  subject?: string;
}

// ---------------------------------------------------------------------------
// Prisma client factory
// ---------------------------------------------------------------------------

/**
 * Create a global singleton Prisma client.
 *
 * Usage: import this in your app entrypoint to ensure a single PrismaClient
 * instance across hot-reloads in development.
 */
export function createPrismaClient(): PrismaClient {
  const globalForPrisma = globalThis as unknown as { __inboxctrl_prisma?: PrismaClient };

  if (!globalForPrisma.__inboxctrl_prisma) {
    globalForPrisma.__inboxctrl_prisma = new PrismaClient();
  }

  return globalForPrisma.__inboxctrl_prisma;
}
