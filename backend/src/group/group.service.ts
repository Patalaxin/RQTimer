import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, Prisma } from '@prisma/client';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';
import { UsersService } from '../users/users.service';
import { MobService } from '../mob/mob.service';
import { IGroup } from './group.interface';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { BotSession, BotSessionDocument } from '../schemas/telegram-bot.schema';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_CODE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class GroupService implements IGroup {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MobService))
    private readonly mobService: MobService,
    // TODO: переедет на Prisma вместе с телеграм-ботом.
    @InjectModel(BotSession.name)
    private readonly sessionModel: Model<BotSessionDocument>,
  ) {}

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
      throw new BadRequestException('User is already in a group');
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

      await this.sessionModel.updateOne(
        { email },
        { $set: { groupName: createGroupDto.name } },
      );

      return this.toResponse(newGroup);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Group with name '${createGroupDto.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async getGroupByName(groupName: string): Promise<GroupResponseDto> {
    const group = await this.prisma.group.findUnique({
      where: { name: groupName },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.toResponse(group);
  }

  async generateInviteCode(groupName: string): Promise<{ inviteCode: string }> {
    const group = await this.prisma.group.findUnique({
      where: { name: groupName },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
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
      throw new NotFoundException('Invalid or expired invite code');
    }

    const codeAgeMs =
      Date.now() - (group.inviteCodeCreatedAt?.getTime() ?? 0);
    if (codeAgeMs > INVITE_CODE_TTL_MS) {
      throw new NotFoundException('Invite code is expired');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.groupName) {
      throw new BadRequestException('User is already in a group');
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

    await this.sessionModel.updateOne(
      { email: new RegExp(`^${email}$`, 'i') },
      { $set: { groupName: group.name } },
    );

    return this.toResponse(updatedGroup);
  }

  async transferGroupLeadership(
    transferLeaderDto: TransferLeaderDto,
    email: string,
    groupName: string,
  ): Promise<GroupResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { newLeaderEmail } = transferLeaderDto;
    const group = await this.prisma.group.findUnique({
      where: { name: groupName },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const newLeader = await this.prisma.user.findFirst({
      where: { email: { equals: newLeaderEmail, mode: 'insensitive' } },
    });
    if (!newLeader) {
      throw new NotFoundException('New leader not found');
    }

    const isNewLeaderInGroup = group.members.some((member) => {
      const [, memberEmail] = member.split(':').map((part) => part.trim());
      return memberEmail === newLeaderEmail;
    });

    if (!isNewLeaderInGroup) {
      throw new NotFoundException('New leader not found in group');
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
      throw new BadRequestException('User is not in a group');
    }

    const group = await this.prisma.group.findUnique({
      where: { name: user.groupName },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (user.isGroupLeader) {
      throw new BadRequestException(
        'You are the group leader. Transfer leadership or delete the group before leaving.',
      );
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

    await this.sessionModel.updateOne(
      { email: new RegExp(`^${email}$`, 'i') },
      { $set: { groupName: null } },
    );
  }

  async deleteGroup(groupName: string): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { name: groupName },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: { groupName },
        data: { groupName: null, isGroupLeader: false },
      }),
      this.prisma.group.delete({ where: { name: groupName } }),
    ]);

    await this.sessionModel.updateMany(
      { groupName },
      { $set: { groupName: null } },
    );

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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Group not found');
      }
      throw error;
    }
  }
}
