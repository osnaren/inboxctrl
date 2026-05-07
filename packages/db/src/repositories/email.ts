import type { PrismaClient, Prisma } from '../generated/client';
import type { EmailFilterQuery, EmailRepository, EmailUpsertData } from '../types';

/**
 * Prisma-backed email metadata repository.
 */
export class PrismaEmailRepository implements EmailRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByMessageId(messageId: string) {
    return this.prisma.emailMetadata.findUnique({
      where: { messageId },
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.emailMetadata.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async findUnread(userId: string, limit = 10) {
    return this.prisma.emailMetadata.findMany({
      where: { userId, isUnread: true },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async upsertFromSync(data: EmailUpsertData) {
    return this.prisma.emailMetadata.upsert({
      where: { messageId: data.messageId },
      update: {
        threadId: data.threadId,
        from: data.from,
        to: data.to,
        subject: data.subject,
        snippet: data.snippet,
        date: data.date,
        isUnread: data.isUnread,
        isStarred: data.isStarred,
        hasAttach: data.hasAttach ?? false,
        labelIds: data.labelIds,
      },
      create: {
        messageId: data.messageId,
        threadId: data.threadId,
        userId: data.userId,
        from: data.from,
        to: data.to,
        subject: data.subject,
        snippet: data.snippet,
        date: data.date,
        isUnread: data.isUnread,
        isStarred: data.isStarred,
        hasAttach: data.hasAttach ?? false,
        labelIds: data.labelIds,
      },
    });
  }

  async countByFilter(userId: string, filter: EmailFilterQuery) {
    return this.prisma.emailMetadata.count({
      where: this.buildFilterWhere(userId, filter),
    });
  }

  async findByFilter(userId: string, filter: EmailFilterQuery, limit = 20) {
    return this.prisma.emailMetadata.findMany({
      where: this.buildFilterWhere(userId, filter),
      take: limit,
      orderBy: { date: 'desc' },
    });
  }

  private buildFilterWhere(userId: string, filter: EmailFilterQuery): Prisma.EmailMetadataWhereInput {
    const conditions: Prisma.EmailMetadataWhereInput[] = [{ userId }];

    if (filter.from) {
      conditions.push({ from: { contains: filter.from } });
    }
    if (filter.to) {
      conditions.push({ to: { contains: filter.to } });
    }
    if (filter.subject) {
      conditions.push({ subject: { contains: filter.subject } });
    }

    return { AND: conditions };
  }
}
