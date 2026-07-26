import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CleanupRegistryService } from '../cleanup/cleanup-registry.service';
import { LanguageEnum } from '../schemas/language.enum';

describe('NotificationService (smoke)', () => {
  let service: NotificationService;
  let prisma: {
    notification: {
      create: jest.Mock;
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let cleanupTasks: Map<string, () => Promise<number | void>>;

  beforeEach(async () => {
    cleanupTasks = new Map();

    prisma = {
      notification: {
        create: jest.fn().mockResolvedValue(undefined),
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CleanupRegistryService,
          useValue: {
            register: jest.fn((name, task) => cleanupTasks.set(name, task)),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationService);
    service.onModuleInit();
  });

  it('stores both languages and a 7-day expiry', async () => {
    const before = Date.now();
    await service.createNotification({
      [LanguageEnum.Русский]: 'Текст',
      [LanguageEnum.English]: 'Text',
    });

    const { data } = prisma.notification.create.mock.calls[0][0];
    expect(data.text).toEqual({ ru: 'Текст', en: 'Text' });

    const ttlMs = data.expiresAt.getTime() - before;
    expect(ttlMs).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
    expect(ttlMs).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });

  it('returns newest first and hides rows the cleanup has not swept yet', async () => {
    prisma.notification.findMany.mockResolvedValue([
      { id: 'b', text: { ru: 'Новое', en: 'New' } },
      { id: 'a', text: { ru: 'Старое', en: 'Old' } },
    ]);

    await expect(service.getNotifications()).resolves.toEqual([
      { id: 'b', text: { ru: 'Новое', en: 'New' } },
      { id: 'a', text: { ru: 'Старое', en: 'Old' } },
    ]);

    const { where, orderBy } = prisma.notification.findMany.mock.calls[0][0];
    expect(orderBy).toEqual({ createdAt: 'desc' });
    // Cleanup крутится раз в час, поэтому протухшие строки отсекаются запросом,
    // иначе они всплывали бы в выдаче — Mongo TTL такого не допускал.
    expect(where.expiresAt.gt).toBeInstanceOf(Date);
  });

  it('registers a cleanup task that deletes expired notifications', async () => {
    const task = cleanupTasks.get('notifications');
    expect(task).toBeDefined();

    prisma.notification.deleteMany.mockResolvedValue({ count: 2 });
    await expect(task()).resolves.toBe(2);

    const { where } = prisma.notification.deleteMany.mock.calls[0][0];
    expect(where.expiresAt.lt).toBeInstanceOf(Date);
  });
});
