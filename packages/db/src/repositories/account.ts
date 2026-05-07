import type { PrismaClient } from '../generated/client';
import type { AccountRepository } from '../types';

/**
 * Prisma-backed account repository.
 */
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProvider(userId: string, providerId = 'google') {
    return this.prisma.account.findFirst({
      where: { userId, providerId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
