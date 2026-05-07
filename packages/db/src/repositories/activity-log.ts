import type { PrismaClient } from '../generated/client';
import type { ActivityLogCreateData, ActivityLogRepository } from '../types';

/**
 * Prisma-backed activity log repository.
 */
export class PrismaActivityLogRepository implements ActivityLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: ActivityLogCreateData) {
    return this.prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        description: data.description,
        metadata: data.metadata ?? null,
      },
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRolledBack(id: string) {
    await this.prisma.activityLog.update({
      where: { id },
      data: { isRolledBack: true },
    });
  }
}
