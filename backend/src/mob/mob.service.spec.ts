import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { MobService } from './mob.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { HistoryService } from '../history/history.service';
import { GroupService } from '../group/group.service';
import { Locations, MobName, MobsTypes, Servers } from '../schemas/mobs.enum';
import { RolesTypes } from '../schemas/roles.enum';
import { HistoryTypes } from '../history/history-types.interface';

const MOB_ID = '673148021e738aba75ba3402';
const GROUP = 'MyGroup';
const NOW_MS = 1_800_000_000_000; // заведомо больше 2^31 — ловит Int-переполнение

const mobRow = (overrides = {}) => ({
  id: MOB_ID,
  mobName: MobName.Архон,
  shortName: 'Арх',
  respawnText: 'текст',
  location: Locations.Междуречье,
  cooldownTime: 3_600_000,
  image: 'arch.avif',
  mobType: MobsTypes.Босс,
  ...overrides,
});

const mobDataRow = (overrides = {}) => ({
  mobId: MOB_ID,
  groupName: GROUP,
  server: Servers.Helios,
  respawnTime: NOW_MS,
  deathTime: NOW_MS - 3_600_000,
  cooldown: 0,
  comment: '',
  respawnLost: false,
  mobTypeAdditionalTime: MobsTypes.Босс,
  ...overrides,
});

describe('MobService (smoke)', () => {
  let service: MobService;
  let prisma: any;
  let historyService: { createHistory: jest.Mock };
  let usersService: { findUser: jest.Mock };
  let groupService: { getGroupByName: jest.Mock };

  beforeEach(async () => {
    prisma = {
      mob: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        delete: jest.fn().mockResolvedValue(mobRow()),
      },
      mobsData: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        delete: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    historyService = { createHistory: jest.fn().mockResolvedValue(undefined) };
    usersService = { findUser: jest.fn() };
    groupService = { getGroupByName: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: HistoryService, useValue: historyService },
        {
          provide: 'IUnixtime',
          useValue: { getCurrentUnixtime: () => ({ unixtime: NOW_MS }) },
        },
        { provide: GroupService, useValue: groupService },
      ],
    }).compile();

    service = module.get(MobService);
  });

  /** Готовит связку «моб есть в справочнике и добавлен в группу». */
  const givenMobInGroup = (mobData = mobDataRow()) => {
    prisma.mob.findUnique.mockResolvedValue(mobRow());
    prisma.mobsData.findUnique.mockResolvedValue(mobData);
  };

  describe('getMobFromGroup', () => {
    it('returns the mob, its group state and the current unixtime', async () => {
      givenMobInGroup();

      const result = await service.getMobFromGroup(
        { mobId: MOB_ID, server: Servers.Helios },
        GROUP,
      );

      expect(result.mob._id).toBe(MOB_ID);
      expect(result.mob).not.toHaveProperty('id');
      expect(result.mobData.respawnTime).toBe(NOW_MS);
      expect(result.unixtime).toBe(NOW_MS);

      // Составной ключ (mobId, groupName, server) — единственный способ
      // адресовать строку mobs_data.
      expect(prisma.mobsData.findUnique).toHaveBeenCalledWith({
        where: {
          mobId_groupName_server: {
            mobId: MOB_ID,
            groupName: GROUP,
            server: Servers.Helios,
          },
        },
      });
    });

    it('rejects when the mob is not in the group', async () => {
      prisma.mob.findUnique.mockResolvedValue(mobRow());

      await expect(
        service.getMobFromGroup(
          { mobId: MOB_ID, server: Servers.Helios },
          GROUP,
        ),
      ).rejects.toMatchObject({ status: 404, code: 'MOB_NOT_FOUND_IN_GROUP' });
    });
  });

  describe('addMobInGroup', () => {
    beforeEach(() => {
      groupService.getGroupByName.mockResolvedValue({
        name: GROUP,
        canMembersAddMobs: true,
      });
      usersService.findUser.mockResolvedValue({ isGroupLeader: false });
    });

    it('skips mobs the group already has instead of failing', async () => {
      prisma.mob.findMany.mockResolvedValue([mobRow()]);
      prisma.mobsData.findMany.mockResolvedValue([mobDataRow()]);

      const result = await service.addMobInGroup(
        'user@example.com',
        Servers.Helios,
        { mobs: [MOB_ID] },
        GROUP,
      );

      expect(prisma.mobsData.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].mob._id).toBe(MOB_ID);
      expect(result[0].mobData.mobId).toBe(MOB_ID);
    });

    it('refuses when a plain member adds mobs in a locked group', async () => {
      groupService.getGroupByName.mockResolvedValue({
        name: GROUP,
        canMembersAddMobs: false,
      });

      await expect(
        service.addMobInGroup(
          'user@example.com',
          Servers.Helios,
          { mobs: [MOB_ID] },
          GROUP,
        ),
      ).rejects.toMatchObject({ status: 403, code: 'MOBS_ADD_FORBIDDEN' });
      expect(prisma.mobsData.createMany).not.toHaveBeenCalled();
    });

    it('rejects the whole batch when one mob is unknown', async () => {
      prisma.mob.findMany.mockResolvedValue([mobRow()]);

      await expect(
        service.addMobInGroup(
          'user@example.com',
          Servers.Helios,
          { mobs: [MOB_ID, 'missing'] },
          GROUP,
        ),
      ).rejects.toThrow('One or more mobs not found');
    });
  });

  describe('updateMobDateOfDeath', () => {
    it('derives the respawn from the cooldown and logs history', async () => {
      givenMobInGroup();
      prisma.mobsData.update.mockResolvedValue(
        mobDataRow({ deathTime: NOW_MS, respawnTime: NOW_MS + 3_600_000 }),
      );

      const result = await service.updateMobDateOfDeath(
        'Nick',
        RolesTypes.User,
        MOB_ID,
        Servers.Helios,
        { dateOfDeath: NOW_MS, comment: undefined },
        GROUP,
      );

      const { data } = prisma.mobsData.update.mock.calls[0][0];
      expect(data.respawnTime).toBe(NOW_MS + 3_600_000);
      expect(data.deathTime).toBe(NOW_MS);
      expect(data.cooldown).toBe(0);
      expect(data.respawnLost).toBe(false);

      // Unix-миллисекунды не должны терять точность — ради этого поле double.
      expect(result.mobData.respawnTime).toBe(NOW_MS + 3_600_000);
      expect(Number.isSafeInteger(result.mobData.respawnTime)).toBe(true);

      const [history] = historyService.createHistory.mock.calls[0];
      expect(history.historyTypes).toBe(HistoryTypes.updateMobDateOfDeath);
      expect(history.toWillResurrect).toBe(NOW_MS + 3_600_000);
      expect(history.mobName).toBe(MobName.Архон);
    });
  });

  describe('updateMobByCooldown', () => {
    it('adds cooldownTime * n to the respawn and bumps the counter', async () => {
      givenMobInGroup(mobDataRow({ cooldown: 1, comment: undefined }));
      prisma.mobsData.update.mockResolvedValue(mobDataRow({ cooldown: 3 }));

      await service.updateMobByCooldown(
        'Nick',
        RolesTypes.User,
        MOB_ID,
        Servers.Helios,
        { cooldown: 2, comment: 'ушёл в ребут' },
        GROUP,
      );

      const { data } = prisma.mobsData.update.mock.calls[0][0];
      expect(data.respawnTime).toBe(NOW_MS + 2 * 3_600_000);
      expect(data.cooldown).toEqual({ increment: 2 });

      const [history] = historyService.createHistory.mock.calls[0];
      expect(history.fromCooldown).toBe(1);
      expect(history.toCooldown).toBe(3);
    });

    it('refuses when the mob has no respawn time yet', async () => {
      givenMobInGroup(mobDataRow({ respawnTime: null }));

      await expect(
        service.updateMobByCooldown(
          'Nick',
          RolesTypes.User,
          MOB_ID,
          Servers.Helios,
          { cooldown: 1, comment: undefined },
          GROUP,
        ),
      ).rejects.toThrow('Respawn time is missing');
      expect(prisma.mobsData.update).not.toHaveBeenCalled();
    });
  });

  describe('updateMobDateOfRespawn', () => {
    it('never derives a negative death time', async () => {
      givenMobInGroup();
      prisma.mobsData.update.mockResolvedValue(mobDataRow());

      await service.updateMobDateOfRespawn(
        'Nick',
        RolesTypes.User,
        MOB_ID,
        Servers.Helios,
        { dateOfRespawn: 1000, comment: undefined },
        GROUP,
      );

      const { data } = prisma.mobsData.update.mock.calls[0][0];
      expect(data.deathTime).toBe(0);
    });
  });

  describe('crashMobServer', () => {
    it('shifts bosses and elites by their own amount, only for future respawns', async () => {
      prisma.mobsData.findMany.mockResolvedValue([]);

      await service.crashMobServer(
        GROUP,
        'Nick',
        RolesTypes.User,
        Servers.Helios,
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const shifts = prisma.mobsData.updateMany.mock.calls.map(([call]) => [
        call.where.mobTypeAdditionalTime,
        call.data.respawnTime.decrement,
        call.where.respawnTime.gte,
      ]);
      expect(shifts).toEqual([
        [MobsTypes.Босс, 300_000, expect.any(Number)],
        [MobsTypes.Элитка, 18_000, expect.any(Number)],
      ]);

      const [history] = historyService.createHistory.mock.calls[0];
      expect(history.historyTypes).toBe(HistoryTypes.crashMobServer);
      expect(history.crashServer).toBe(true);
    });

    // Раньше здесь стоял `catch {}`, превращавший любой сбой — упавшую
    // транзакцию, недоступную БД — в 400 «Something went wrong» без единой
    // строчки в логе. Причина должна доходить до фильтра нетронутой.
    it('lets a failing transaction surface instead of flattening it to 400', async () => {
      const dbFailure = new Error('connection terminated');
      prisma.$transaction.mockRejectedValue(dbFailure);

      await expect(
        service.crashMobServer(GROUP, 'Nick', RolesTypes.User, Servers.Helios),
      ).rejects.toBe(dbFailure);
      expect(historyService.createHistory).not.toHaveBeenCalled();
    });
  });

  describe('respawnLost', () => {
    it('clears the timers and flags the respawn as lost', async () => {
      givenMobInGroup();
      prisma.mobsData.update.mockResolvedValue(
        mobDataRow({ respawnTime: null, deathTime: null, respawnLost: true }),
      );

      const result = await service.respawnLost(
        { mobId: MOB_ID, server: Servers.Helios },
        'Nick',
        RolesTypes.User,
        GROUP,
      );

      const { data } = prisma.mobsData.update.mock.calls[0][0];
      expect(data).toEqual({
        cooldown: 0,
        respawnTime: null,
        deathTime: null,
        respawnLost: true,
      });
      expect(result.mobData.respawnLost).toBe(true);
    });

    // Прежний `catch {}` съедал и осмысленную ошибку «моба нет в группе»,
    // подменяя её невнятным «Failed to process respawn lost».
    it('keeps the "mob is not in this group" error instead of masking it', async () => {
      prisma.mob.findUnique.mockResolvedValue(mobRow());
      prisma.mobsData.findUnique.mockResolvedValue(null);

      await expect(
        service.respawnLost(
          { mobId: MOB_ID, server: Servers.Helios },
          'Nick',
          RolesTypes.User,
          GROUP,
        ),
      ).rejects.toMatchObject({
        message: 'Mob or Mob data not found for this group',
      });
      expect(prisma.mobsData.update).not.toHaveBeenCalled();
    });
  });

  describe('findAllGroupMobs', () => {
    it('joins the catalog in one query and keeps mob and state together', async () => {
      prisma.mobsData.findMany.mockResolvedValue([
        { ...mobDataRow(), mob: mobRow() },
      ]);

      const result = await service.findAllGroupMobs(
        { server: Servers.Helios },
        GROUP,
      );

      expect(prisma.mobsData.findMany).toHaveBeenCalledWith({
        where: { groupName: GROUP, server: Servers.Helios },
        include: { mob: true },
      });
      expect(result).toHaveLength(1);
      expect(result[0].mob._id).toBe(MOB_ID);
      // Объект моба не должен протечь внутрь mobData.
      expect(result[0].mobData).not.toHaveProperty('mob');
    });
  });

  describe('createMob', () => {
    it('maps a duplicate mob to 409', async () => {
      prisma.mob.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.createMob(mobRow() as any)).rejects.toMatchObject({
        status: 409,
        code: 'MOB_ALREADY_EXISTS',
      });
    });

    // Раньше любая другая ошибка становилась `BadRequestException(error)`,
    // то есть сырой объект Prisma в теле ответа — а его интерцептор фронта
    // показывает пользователю тостом.
    it('does not wrap an unrelated failure into a 400 with the raw error', async () => {
      const dbFailure = new Error('connection terminated');
      prisma.mob.create.mockRejectedValue(dbFailure);

      await expect(service.createMob(mobRow() as any)).rejects.toBe(dbFailure);
    });
  });

  describe('deleteMob', () => {
    it('removes the catalog entry and lets the FK cascade clear group data', async () => {
      await expect(service.deleteMob(MOB_ID)).resolves.toEqual({
        message: 'Mob deleted',
      });
      expect(prisma.mob.delete).toHaveBeenCalledWith({ where: { id: MOB_ID } });
      expect(prisma.mobsData.deleteMany).not.toHaveBeenCalled();
    });

    it('maps a missing mob to 404', async () => {
      prisma.mob.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(service.deleteMob(MOB_ID)).rejects.toMatchObject({
        status: 404,
        code: 'MOB_NOT_FOUND',
      });
    });
  });

  describe('removeMobFromGroup', () => {
    it('deletes only the group row, not the catalog entry', async () => {
      givenMobInGroup();

      await service.removeMobFromGroup(
        { mobId: MOB_ID, server: Servers.Helios },
        GROUP,
      );

      expect(prisma.mobsData.delete).toHaveBeenCalled();
      expect(prisma.mob.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteAllMobData', () => {
    it('wipes every row of the group', async () => {
      await service.deleteAllMobData(GROUP);

      expect(prisma.mobsData.deleteMany).toHaveBeenCalledWith({
        where: { groupName: GROUP },
      });
    });
  });
});
