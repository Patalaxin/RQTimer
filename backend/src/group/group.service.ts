import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Group } from '@prisma/client';
import { ConflictError, NotFoundError } from '../errors/app.error';
import { mapPrismaError } from '../errors/map-prisma-error';
import { UserNotFound } from '../users/users.errors';
import {
  AlreadyInGroup,
  GroupNotFound,
  LeaderMustTransferFirst,
  NotInGroup,
} from './group.errors';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';
import { UsersService } from '../users/users.service';
import { MobService } from '../mob/mob.service';
import { IGroup } from './group.interface';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_CODE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class GroupService implements IGroup {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MobService))
    private readonly mobService: MobService,
  ) {}

  /**
   * Сессия телеграм-бота есть не у каждого пользователя, поэтому везде
   * updateMany: на пустой выборке он просто ничего не делает.
   */
  private async setBotSessionGroup(
    email: string,
    groupName: string | null,
  ): Promise<void> {
    await this.prisma.botSession.updateMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      data: { groupName },
    });
  }

  private toResponse(group: Group): GroupResponseDto {
    return {
      name: group.name,
      groupLeader: group.groupLeader,
      members: group.members,
      canMembersAddMobs: group.canMembersAddMobs,
    };
  }

  async createGroup(
    email: string,
    createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    const user = await this.usersService.findUser(email);

    if (user.groupName) {
      throw new AlreadyInGroup();
    }

    try {
      const newGroup = await this.prisma.group.create({
        data: {
          ...createGroupDto,
          groupLeader: email,
          members: [`${user.nickname}: ${user.email}`],
        },
      });

      await this.prisma.user.update({
        where: { email },
        data: { groupName: createGroupDto.name, isGroupLeader: true },
      });

      await this.setBotSessionGroup(email, createGroupDto.name);

      return this.toResponse(newGroup);
    } catch (error) {
      throw mapPrismaError(error, {
        P2002: () =>
          new ConflictError(
            'GROUP_NAME_TAKEN',
            `Group with name '${createGroupDto.name}' already exists`,
          ),
      });
    }
  }

  async getGroupByName(groupName: string): Promise<GroupResponseDto> {
    const group = await this.prisma.group.findUnique({
      where: { name: groupName },
    });

    if (!group) {
      throw new GroupNotFound();
    }

    return this.toResponse(group);
  }

  async generateInviteCode(groupName: string): Promise<{ inviteCode: string }> {
    const group = await this.prisma.group.findUnique({
      where: { name: groupName },
    });
    if (!group) {
      throw new GroupNotFound();
    }

    const inviteCode = Math.random().toString(36).substring(2, 8);
    await this.prisma.group.update({
      where: { name: groupName },
      data: { inviteCode, inviteCodeCreatedAt: new Date() },
    });

    return { inviteCode };
  }

  async joinGroup(
    joinGroupDto: JoinGroupDto,
    email: string,
  ): Promise<GroupResponseDto> {
    const { inviteCode } = joinGroupDto;
    const group = await this.prisma.group.findUnique({ where: { inviteCode } });
    if (!group) {
      throw new NotFoundError(
        'INVITE_CODE_INVALID',
        'Invalid or expired invite code',
      );
    }

    const codeAgeMs = Date.now() - (group.inviteCodeCreatedAt?.getTime() ?? 0);
    if (codeAgeMs > INVITE_CODE_TTL_MS) {
      throw new NotFoundError('INVITE_CODE_EXPIRED', 'Invite code is expired');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UserNotFound('User not found');
    }
    if (user.groupName) {
      throw new AlreadyInGroup();
    }

    // Код одноразовый: гасим его тем же запросом, что добавляет участника.
    const updatedGroup = await this.prisma.group.update({
      where: { name: group.name },
      data: {
        members: { push: `${user.nickname}: ${user.email}` },
        inviteCode: null,
        inviteCodeCreatedAt: null,
      },
    });

    await this.prisma.user.update({
      where: { email },
      data: { groupName: group.name },
    });

    await this.setBotSessionGroup(email, group.name);

    return this.toResponse(updatedGroup);
  }

  async transferGroupLeadership(
    transferLeaderDto: TransferLeaderDto,
    email: string,
    groupName: string,
  ): Promise<GroupResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UserNotFound('User not found');
    }

    const { newLeaderEmail } = transferLeaderDto;
    const group = await this.prisma.group.findUnique({
      where: { name: groupName },
    });
    if (!group) {
      throw new GroupNotFound();
    }

    const newLeader = await this.prisma.user.findFirst({
      where: { email: { equals: newLeaderEmail, mode: 'insensitive' } },
    });
    if (!newLeader) {
      throw new NotFoundError('NEW_LEADER_NOT_FOUND', 'New leader not found');
    }

    const isNewLeaderInGroup = group.members.some((member) => {
      const [, memberEmail] = member.split(':').map((part) => part.trim());
      return memberEmail === newLeaderEmail;
    });

    if (!isNewLeaderInGroup) {
      throw new NotFoundError(
        'NEW_LEADER_NOT_IN_GROUP',
        'New leader not found in group',
      );
    }

    const [updatedGroup] = await this.prisma.$transaction([
      this.prisma.group.update({
        where: { name: groupName },
        data: { groupLeader: newLeaderEmail },
      }),
      this.prisma.user.update({
        where: { id: newLeader.id },
        data: { isGroupLeader: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { isGroupLeader: false },
      }),
    ]);

    return this.toResponse(updatedGroup);
  }

  async leaveGroup(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (!user?.groupName) {
      throw new NotInGroup();
    }

    const group = await this.prisma.group.findUnique({
      where: { name: user.groupName },
    });
    if (!group) {
      throw new GroupNotFound();
    }

    if (user.isGroupLeader) {
      throw new LeaderMustTransferFirst();
    }

    const members = group.members.filter((member) => {
      const [memberNickname] = member.split(':').map((part) => part.trim());

      return memberNickname !== user.nickname;
    });

    await this.prisma.$transaction([
      this.prisma.group.update({
        where: { name: group.name },
        data: { members },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { groupName: null, isGroupLeader: false },
      }),
    ]);

    await this.setBotSessionGroup(email, null);
  }

  async deleteGroup(groupName: string): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { name: groupName },
    });

    if (!group) {
      throw new GroupNotFound();
    }

    await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: { groupName },
        data: { groupName: null, isGroupLeader: false },
      }),
      this.prisma.group.delete({ where: { name: groupName } }),
    ]);

    await this.prisma.botSession.updateMany({
      where: { groupName },
      data: { groupName: null },
    });

    await this.mobService.deleteAllMobData(groupName);
  }

  async updateGroup(
    groupName: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    try {
      const group = await this.prisma.group.update({
        where: { name: groupName },
        data: updateGroupDto,
      });

      return this.toResponse(group);
    } catch (error) {
      throw mapPrismaError(error, {
        P2025: () => new NotFoundError('GROUP_NOT_FOUND', 'Group not found'),
      });
    }
  }
}
