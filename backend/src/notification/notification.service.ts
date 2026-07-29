import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';
import { INotification } from './notification.interface';
import { LanguageEnum } from '../schemas/language.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CleanupRegistryService } from '../cleanup/cleanup-registry.service';

const NOTIFICATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationService implements INotification, OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cleanupRegistry: CleanupRegistryService,
  ) {}

  onModuleInit(): void {
    this.cleanupRegistry.register('notifications', async () => {
      const { count } = await this.prisma.notification.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return count;
    });
  }

  async createNotification(dto: CreateNotificationDto): Promise<void> {
    await this.prisma.notification.create({
      data: {
        text: { ...dto } as Prisma.InputJsonObject,
        expiresAt: new Date(Date.now() + NOTIFICATION_TTL_MS),
      },
    });
  }

  async getNotifications(): Promise<GetNotificationsDtoResponse[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((notification) => ({
      id: notification.id,
      text: notification.text as Record<LanguageEnum, string>,
    }));
  }
}
