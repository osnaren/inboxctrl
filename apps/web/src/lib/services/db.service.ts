/**
 * App-layer DB service - thin wrapper around @inboxctrl/db repositories.
 *
 * This file exists for backwards compatibility with existing imports.
 * New code should import directly from @inboxctrl/db.
 */
import {
  PrismaAccountRepository,
  PrismaEmailRepository,
  PrismaLabelRepository,
  PrismaActivityLogRepository,
} from '@inboxctrl/db';

import { prisma } from '@/lib/prisma';

export class DBService {
  private readonly accounts = new PrismaAccountRepository(prisma);
  private readonly emails = new PrismaEmailRepository(prisma);
  private readonly labels = new PrismaLabelRepository(prisma);
  private readonly activityLogs = new PrismaActivityLogRepository(prisma);

  async getAccount(userId: string, providerId = 'google') {
    return this.accounts.findByProvider(userId, providerId);
  }

  async getUserLabels(userId: string) {
    return this.labels.findByUser(userId);
  }

  async getUserEmails(userId: string, limit = 50) {
    return this.emails.findByUser(userId, limit);
  }

  async getUnreadEmails(userId: string, limit = 10) {
    return this.emails.findUnread(userId, limit);
  }

  async emailExists(messageId: string) {
    return this.emails.findByMessageId(messageId);
  }
}
