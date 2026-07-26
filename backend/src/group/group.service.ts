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
import { Group, GroupDocument } from '../schemas/group.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';
import { UsersService } from '../users/users.service';
import { plainToInstance } from 'class-transformer';
import { MobService } from '../mob/mob.service';
import { IGroup } from './group.interface';
import { UpdateGroupDto } from './dto/update-group.dto';
import { BotSession, BotSessionDocument } from '../schemas/telegram-bot.schema';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupService implements IGroup {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MobService))
    private readonly mobService: MobService,
    @InjectModel(BotSession.name)
    private readonly sessionModel: Model<BotSessionDocument>,
  ) {}

  async createGroup(
    email: string,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    const user = await this.usersService.findUser(email);

    if (user.groupName) {
      throw new BadRequestException('User is already in a group');
    }

    try {
      const newGroup = await this.groupModel.create({
        ...createGroupDto,
        groupLeader: email,
        members: [`${user.nickname}: ${user.email}`],
      });

      await this.prisma.user.update({
        where: { email },
        data: { groupName: createGroupDto.name, isGroupLeader: true },
      });

      await this.sessionModel.updateOne(
        { email },
        { $set: { groupName: createGroupDto.name } },
      );

      return plainToInstance(Group, newGroup.toObject());
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Group with name '${createGroupDto.name}' already exists`,
        );
      }
      throw error;
    }
  }

  async getGroupByName(groupName: string): Promise<Group> {
    const group = await this.groupModel
      .findOne({ name: groupName }, { _id: 0, __v: 0 })
      .lean();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return plainToInstance(Group, group);
  }

  async generateInviteCode(groupName: string): Promise<{ inviteCode: string }> {
    const group = await this.groupModel.findOne({ name: groupName });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const inviteCode = Math.random().toString(36).substring(2, 8);
    group.inviteCode = inviteCode;
    group.inviteCodeCreatedAt = new Date();
    await group.save();

    return { inviteCode };
  }

  async joinGroup(joinGroupDto: JoinGroupDto, email: string): Promise<Group> {
    const { inviteCode } = joinGroupDto;
    const group = await this.groupModel.findOne({ inviteCode });
    if (!group) {
      throw new NotFoundException('Invalid or expired invite code');
    }

    // Check if the invite code is expired
    const currentTime = new Date();
    const inviteCodeCreationTime = group.inviteCodeCreatedAt;
    const timeDifferenceInSeconds =
      (currentTime.getTime() - inviteCodeCreationTime.getTime()) / 1000;

    if (timeDifferenceInSeconds > 3600) {
      // 3600 seconds = 1 hour
      throw new NotFoundException('Invite code is expired');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.groupName) {
      throw new BadRequestException('User is already in a group');
    }

    const memberEntry = `${user.nickname}: ${user.email}`;
    group.members.push(memberEntry);
    group.inviteCode = null;

    await group.save();

    await this.prisma.user.update({
      where: { email },
      data: { groupName: group.name },
    });

    await this.sessionModel.updateOne(
      { email: new RegExp(`^${email}$`, 'i') },
      { $set: { groupName: group.name } },
    );

    return group.toObject();
  }

  async transferGroupLeadership(
    transferLeaderDto: TransferLeaderDto,
    email: string,
    groupName: string,
  ): Promise<Group> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { newLeaderEmail } = transferLeaderDto;
    const group = await this.groupModel.findOne({ name: groupName });
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

    group.groupLeader = newLeaderEmail;
    await group.save();

    await this.prisma.user.update({
      where: { id: newLeader.id },
      data: { isGroupLeader: true },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isGroupLeader: false },
    });

    return group.toObject();
  }

  async leaveGroup(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (!user?.groupName) {
      throw new BadRequestException('User is not in a group');
    }

    const group = await this.groupModel.findOne({ name: user.groupName });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (user.isGroupLeader) {
      throw new BadRequestException(
        'You are the group leader. Transfer leadership or delete the group before leaving.',
      );
    }

    group.members = group.members.filter((member) => {
      const [memberNickname] = member.split(':').map((part) => part.trim());

      return memberNickname !== user.nickname;
    });

    await group.save();

    await this.sessionModel.updateOne(
      { email: new RegExp(`^${email}$`, 'i') },
      { $set: { groupName: null } },
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { groupName: null, isGroupLeader: false },
    });
  }

  async deleteGroup(groupName: string): Promise<void> {
    const group = await this.groupModel.findOne({ name: groupName });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.user.updateMany({
      where: { groupName },
      data: { groupName: null, isGroupLeader: false },
    });

    await this.sessionModel.updateMany(
      { groupName },
      { $set: { groupName: null } },
    );

    await this.groupModel.deleteOne({ name: groupName });
    await this.mobService.deleteAllMobData(groupName);
  }

  async updateGroup(
    groupName: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    const group = await this.groupModel
      .findOneAndUpdate(
        { name: groupName },
        { $set: updateGroupDto },
        { new: true, runValidators: true, projection: { _id: 0, __v: 0 } },
      )
      .lean()
      .exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return plainToInstance(Group, group);
  }
}
