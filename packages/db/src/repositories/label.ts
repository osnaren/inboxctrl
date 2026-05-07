import type { LabelRepository, LabelUpsertData } from '../types';
import type { PrismaClient } from '@prisma/client';

/**
 * Prisma-backed label repository.
 */
export class PrismaLabelRepository implements LabelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUser(userId: string) {
    return this.prisma.label.findMany({
      where: { userId },
    });
  }

  async findByGmailId(gmailId: string) {
    return this.prisma.label.findUnique({
      where: { gmailId },
    });
  }

  async upsertFromSync(data: LabelUpsertData) {
    return this.prisma.label.upsert({
      where: { gmailId: data.gmailId },
      update: {
        name: data.name,
        type: data.type,
        color: data.color,
      },
      create: {
        gmailId: data.gmailId,
        userId: data.userId,
        name: data.name,
        type: data.type,
        color: data.color,
      },
    });
  }

  async deleteByGmailId(gmailId: string) {
    await this.prisma.label.delete({
      where: { gmailId },
    });
  }
}
