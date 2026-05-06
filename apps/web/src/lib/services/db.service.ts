import { prisma } from '@/lib/prisma';

export class DBService {
  async getAccount(userId: string, providerId: string = 'google') {
    return await prisma.account.findFirst({
      where: { userId, providerId },
    });
  }

  async getUserLabels(userId: string) {
    return await prisma.label.findMany({
      where: { userId },
    });
  }

  async getUserEmails(userId: string, limit: number = 50) {
    return await prisma.emailMetadata.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async getUnreadEmails(userId: string, limit: number = 10) {
    return await prisma.emailMetadata.findMany({
      where: { userId, isUnread: true },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async emailExists(messageId: string) {
    return await prisma.emailMetadata.findFirst({
      where: { messageId },
    });
  }
}
