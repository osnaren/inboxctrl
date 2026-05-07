import type { AccountRepository } from '../types';
import type { PrismaClient } from '@prisma/client';

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
