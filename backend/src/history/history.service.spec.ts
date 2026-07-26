import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HistoryService } from './history.service';
import { PrismaService } from '../prisma/prisma.service';
import { CleanupRegistryService } from '../cleanup/cleanup-registry.service';
import { Locations, MobName, Servers } from '../schemas/mobs.enum';
import { RolesTypes } from '../schemas/roles.enum';
import { HistoryTypes } from './history-types.interface';

const ARCHON_ID = '673148021e738aba75ba3402';
const GROUP = 'MyGroup';
const NOW_MS = 1_800_000_000_000;

const historyRow = (overrides = {}) => ({
  id: 'history-1',
  mobId: ARCHON_ID,
  mobName: MobName.Архон,
  location: Locations.Междуречье,
  nickname: 'Nick',
  role: RolesTypes.User,
  server: Servers.Helios,
  groupName: GROUP,
  historyTypes: HistoryTypes.updateMobDateOfDeath,
  date: NOW_MS,
  toWillResurrect: NOW_MS + 3_600_000,
  fromCooldown: null,
  toCooldown: null,
  crashServer: false,
  expiresAt: new Date(),
  ...overrides,
});

describe('HistoryService (smoke)', () => {
  let service: HistoryService;
  let prisma: any;
  let cleanupTasks: Map<string, () => Promise<number | void>>;

  beforeEach(async () => {
    cleanupTasks = new Map();
    prisma = {
      history: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      mob: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CleanupRegistryService,
          useValue: {
            register: jest.fn((name, task) => cleanupTasks.set(name, task)),
          },
        },
      ],
    }).compile();

    service = module.get(HistoryService);
    service.onModuleInit();
  });

  describe('createHistory', () => {
    it('writes both servers into one table and stamps a 3-day expiry', async () => {
      prisma.history.create.mockResolvedValue(historyRow());
      const before = Date.now();

      await service.createHistory({
        mobId: ARCHON_ID,
        mobName: MobName.Архон,
        location: Locations.Междуречье,
        nickname: 'Nick',
        server: Servers.Fenix,
        groupName: GROUP,
        date: NOW_MS,
        role: RolesTypes.User,
        historyTypes: HistoryTypes.updateMobDateOfDeath,
        toWillResurrect: NOW_MS + 3_600_000,
      });
      const after = Date.now();

      const { data } = prisma.history.create.mock.calls[0][0];
      // Сервер стал колонкой вместо отдельной коллекции на каждый сервер.
      expect(data.server).toBe(Servers.Fenix);
      expect(data.date).toBe(NOW_MS);
      expect(data.toWillResurrect).toBe(NOW_MS + 3_600_000);

      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + threeDaysMs,
      );
      expect(data.expiresAt.getTime()).toBeLessThanOrEqual(
        after + threeDaysMs,
      );
    });

    it('keeps a server-crash entry that has no mob', async () => {
      prisma.history.create.mockResolvedValue(
        historyRow({ mobId: null, location: null, crashServer: true }),
      );

      const result = await service.createHistory({
        mobName: MobName.Все,
        nickname: 'Nick',
        server: Servers.Helios,
        groupName: GROUP,
        date: NOW_MS,
        role: RolesTypes.User,
        historyTypes: HistoryTypes.crashMobServer,
        crashServer: true,
      });

      const { data } = prisma.history.create.mock.calls[0][0];
      expect(data.mobId).toBeNull();
      expect(data.crashServer).toBe(true);
      expect(result.mobId).toBeUndefined();
    });
  });

  describe('getAllHistory', () => {
    it('filters by server and group, newest first, and paginates', async () => {
      prisma.history.count.mockResolvedValue(25);
      prisma.history.findMany.mockResolvedValue([historyRow()]);

      const result = await service.getAllHistory(
        Servers.Helios,
        GROUP,
        3,
        10,
        'ru',
      );

      const query = prisma.history.findMany.mock.calls[0][0];
      expect(query.where).toEqual({ server: Servers.Helios, groupName: GROUP });
      expect(query.orderBy).toEqual({ date: 'desc' });
      expect(query.skip).toBe(20);
      expect(query.take).toBe(10);
      expect(result.total).toBe(25);
      expect(result.pages).toBe(3);
      expect(result.data[0].mobName).toBe(MobName.Архон);
    });

    it('narrows by history type when one is asked for', async () => {
      await service.getAllHistory(
        Servers.Helios,
        GROUP,
        1,
        10,
        'ru',
        HistoryTypes.crashMobServer,
      );

      const { where } = prisma.history.findMany.mock.calls[0][0];
      expect(where.historyTypes).toBe(HistoryTypes.crashMobServer);
    });

    it('rejects a request without a group', async () => {
      await expect(
        service.getAllHistory(Servers.Helios, '', 1, 10),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.history.findMany).not.toHaveBeenCalled();
    });

    it('overlays translations from the catalog for a non-ru language', async () => {
      prisma.history.count.mockResolvedValue(1);
      prisma.history.findMany.mockResolvedValue([historyRow()]);
      prisma.mob.findMany.mockResolvedValue([
        {
          id: ARCHON_ID,
          mobName: MobName.Архон,
          shortName: 'Арх',
          respawnText: null,
          location: Locations.Междуречье,
          cooldownTime: 1,
          image: null,
          mobType: 'Босс',
        },
      ]);

      const result = await service.getAllHistory(
        Servers.Helios,
        GROUP,
        1,
        10,
        'en',
      );

      expect(result.data[0].mobName).toBe('Archon');
      expect(result.data[0].location).toBe('Interfluve');
    });

    it('falls back to the stored name when the mob left the catalog', async () => {
      prisma.history.count.mockResolvedValue(1);
      prisma.history.findMany.mockResolvedValue([historyRow()]);
      prisma.mob.findMany.mockResolvedValue([]);

      const result = await service.getAllHistory(
        Servers.Helios,
        GROUP,
        1,
        10,
        'en',
      );

      expect(result.data[0].mobName).toBe(MobName.Архон);
    });
  });

  describe('getMobHistory', () => {
    it('adds the mob to the filter', async () => {
      await service.getMobHistory(Servers.Fenix, GROUP, ARCHON_ID, 1, 10);

      const { where } = prisma.history.findMany.mock.calls[0][0];
      expect(where).toEqual({
        server: Servers.Fenix,
        groupName: GROUP,
        mobId: ARCHON_ID,
      });
    });

    it('rejects a request without a mob', async () => {
      await expect(
        service.getMobHistory(Servers.Fenix, GROUP, '', 1, 10),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  it('deleteAll clears only the given server of the given group', async () => {
    await service.deleteAll(Servers.Helios, GROUP);

    expect(prisma.history.deleteMany).toHaveBeenCalledWith({
      where: { server: Servers.Helios, groupName: GROUP },
    });
  });

  it('registers a cleanup task that deletes expired entries', async () => {
    const task = cleanupTasks.get('history');
    expect(task).toBeDefined();

    prisma.history.deleteMany.mockResolvedValue({ count: 7 });
    await expect(task()).resolves.toBe(7);

    const { where } = prisma.history.deleteMany.mock.calls[0][0];
    expect(where.expiresAt.lt).toBeInstanceOf(Date);
  });
});
