import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GroupService } from './group.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MobService } from '../mob/mob.service';

const LEADER = 'leader@example.com';
const MEMBER = 'member@example.com';

const group = (overrides = {}) => ({
  name: 'MyGroup',
  groupLeader: LEADER,
  members: [`Leader: ${LEADER}`],
  canMembersAddMobs: false,
  inviteCode: null,
  inviteCodeCreatedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const user = (overrides = {}) => ({
  id: 'user-1',
  email: MEMBER,
  nickname: 'Member',
  groupName: null,
  isGroupLeader: false,
  ...overrides,
});

describe('GroupService (smoke)', () => {
  let service: GroupService;
  let prisma: any;
  let usersService: { findUser: jest.Mock };
  let mobService: { deleteAllMobData: jest.Mock };

  beforeEach(async () => {
    prisma = {
      group: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      botSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      // $transaction получает массив уже подготовленных промисов и возвращает
      // их результаты в том же порядке.
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    usersService = { findUser: jest.fn() };
    mobService = { deleteAllMobData: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
        { provide: MobService, useValue: mobService },
      ],
    }).compile();

    service = module.get(GroupService);
  });

  describe('createGroup', () => {
    it('creates the group, seeds the leader as a member and flags the user', async () => {
      usersService.findUser.mockResolvedValue({
        nickname: 'Leader',
        email: LEADER,
        groupName: null,
      });
      prisma.group.create.mockResolvedValue(group());

      const result = await service.createGroup(LEADER, { name: 'MyGroup' });

      const { data } = prisma.group.create.mock.calls[0][0];
      expect(data.groupLeader).toBe(LEADER);
      expect(data.members).toEqual([`Leader: ${LEADER}`]);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: LEADER },
        data: { groupName: 'MyGroup', isGroupLeader: true },
      });
      // Инвайт-код не должен попадать в ответ API.
      expect(result).not.toHaveProperty('inviteCode');
      expect(result).toEqual({
        name: 'MyGroup',
        groupLeader: LEADER,
        members: [`Leader: ${LEADER}`],
        canMembersAddMobs: false,
      });
    });

    it('rejects a user who is already in a group', async () => {
      usersService.findUser.mockResolvedValue({
        nickname: 'Leader',
        email: LEADER,
        groupName: 'Other',
      });

      await expect(
        service.createGroup(LEADER, { name: 'MyGroup' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.group.create).not.toHaveBeenCalled();
    });

    it('maps the unique-name violation to 409', async () => {
      usersService.findUser.mockResolvedValue({
        nickname: 'Leader',
        email: LEADER,
        groupName: null,
      });
      prisma.group.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.createGroup(LEADER, { name: 'MyGroup' }),
      ).rejects.toMatchObject({ status: 409, code: 'GROUP_NAME_TAKEN' });
    });
  });

  describe('joinGroup', () => {
    it('adds the member and burns the invite code', async () => {
      prisma.group.findUnique.mockResolvedValue(
        group({ inviteCode: 'abc123', inviteCodeCreatedAt: new Date() }),
      );
      prisma.user.findUnique.mockResolvedValue(user());
      prisma.group.update.mockResolvedValue(
        group({ members: [`Leader: ${LEADER}`, `Member: ${MEMBER}`] }),
      );

      const result = await service.joinGroup({ inviteCode: 'abc123' }, MEMBER);

      const { data } = prisma.group.update.mock.calls[0][0];
      expect(data.members).toEqual({ push: `Member: ${MEMBER}` });
      expect(data.inviteCode).toBeNull();
      expect(data.inviteCodeCreatedAt).toBeNull();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: MEMBER },
        data: { groupName: 'MyGroup' },
      });
      expect(result.members).toContain(`Member: ${MEMBER}`);
    });

    it('rejects an unknown invite code', async () => {
      await expect(
        service.joinGroup({ inviteCode: 'nope' }, MEMBER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a code older than an hour', async () => {
      prisma.group.findUnique.mockResolvedValue(
        group({
          inviteCode: 'abc123',
          inviteCodeCreatedAt: new Date(Date.now() - 61 * 60 * 1000),
        }),
      );

      await expect(
        service.joinGroup({ inviteCode: 'abc123' }, MEMBER),
      ).rejects.toThrow('Invite code is expired');
      expect(prisma.group.update).not.toHaveBeenCalled();
    });

    it('rejects a user who is already in a group', async () => {
      prisma.group.findUnique.mockResolvedValue(
        group({ inviteCode: 'abc123', inviteCodeCreatedAt: new Date() }),
      );
      prisma.user.findUnique.mockResolvedValue(user({ groupName: 'Other' }));

      await expect(
        service.joinGroup({ inviteCode: 'abc123' }, MEMBER),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.group.update).not.toHaveBeenCalled();
    });
  });

  describe('transferGroupLeadership', () => {
    it('moves the flag between both users in one transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(
        user({ id: 'old', email: LEADER, isGroupLeader: true }),
      );
      prisma.group.findUnique.mockResolvedValue(
        group({ members: [`Leader: ${LEADER}`, `Member: ${MEMBER}`] }),
      );
      prisma.user.findFirst.mockResolvedValue(user({ id: 'new' }));
      prisma.group.update.mockResolvedValue(group({ groupLeader: MEMBER }));

      const result = await service.transferGroupLeadership(
        { newLeaderEmail: MEMBER },
        LEADER,
        'MyGroup',
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'new' },
        data: { isGroupLeader: true },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'old' },
        data: { isGroupLeader: false },
      });
      expect(result.groupLeader).toBe(MEMBER);
    });

    it('refuses to hand leadership to someone outside the group', async () => {
      prisma.user.findUnique.mockResolvedValue(user({ email: LEADER }));
      prisma.group.findUnique.mockResolvedValue(group());
      prisma.user.findFirst.mockResolvedValue(user({ id: 'new' }));

      await expect(
        service.transferGroupLeadership(
          { newLeaderEmail: MEMBER },
          LEADER,
          'MyGroup',
        ),
      ).rejects.toThrow('New leader not found in group');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('leaveGroup', () => {
    it('drops the member from the list and clears their group', async () => {
      prisma.user.findFirst.mockResolvedValue(
        user({ groupName: 'MyGroup', nickname: 'Member' }),
      );
      prisma.group.findUnique.mockResolvedValue(
        group({ members: [`Leader: ${LEADER}`, `Member: ${MEMBER}`] }),
      );

      await service.leaveGroup(MEMBER);

      const { data } = prisma.group.update.mock.calls[0][0];
      expect(data.members).toEqual([`Leader: ${LEADER}`]);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { groupName: null, isGroupLeader: false },
      });
    });

    it('does not let the leader walk out on the group', async () => {
      prisma.user.findFirst.mockResolvedValue(
        user({ groupName: 'MyGroup', isGroupLeader: true }),
      );
      prisma.group.findUnique.mockResolvedValue(group());

      await expect(service.leaveGroup(LEADER)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.group.update).not.toHaveBeenCalled();
    });

    it('rejects a user without a group', async () => {
      prisma.user.findFirst.mockResolvedValue(user({ groupName: null }));

      await expect(service.leaveGroup(MEMBER)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('deleteGroup', () => {
    it('detaches members, removes the group and wipes its mob data', async () => {
      prisma.group.findUnique.mockResolvedValue(group());

      await service.deleteGroup('MyGroup');

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { groupName: 'MyGroup' },
        data: { groupName: null, isGroupLeader: false },
      });
      expect(prisma.group.delete).toHaveBeenCalledWith({
        where: { name: 'MyGroup' },
      });
      expect(mobService.deleteAllMobData).toHaveBeenCalledWith('MyGroup');
      // Сессии бота отвязываются от исчезнувшей группы.
      expect(prisma.botSession.updateMany).toHaveBeenCalledWith({
        where: { groupName: 'MyGroup' },
        data: { groupName: null },
      });
    });

    it('does not touch anything when the group is missing', async () => {
      await expect(service.deleteGroup('Ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mobService.deleteAllMobData).not.toHaveBeenCalled();
    });
  });

  describe('generateInviteCode', () => {
    it('stores a fresh code with its creation time', async () => {
      prisma.group.findUnique.mockResolvedValue(group());
      prisma.group.update.mockResolvedValue(group());

      const { inviteCode } = await service.generateInviteCode('MyGroup');

      expect(inviteCode).toMatch(/^[a-z0-9]{1,6}$/);
      const { data } = prisma.group.update.mock.calls[0][0];
      expect(data.inviteCode).toBe(inviteCode);
      expect(data.inviteCodeCreatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateGroup', () => {
    it('maps a missing group to 404', async () => {
      prisma.group.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.updateGroup('Ghost', { canMembersAddMobs: true }),
      ).rejects.toMatchObject({ status: 404, code: 'GROUP_NOT_FOUND' });
    });
  });
});
