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
import { User, UserDocument } from '../schemas/user.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';
import { UsersService } from '../users/users.service';
import { plainToInstance } from 'class-transformer';
import { MobService } from '../mob/mob.service';
import { IGroup } from './group.interface';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService implements IGroup {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MobService)) private mobService: MobService,
  ) {}

  async createGroup(
    email: string,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    const user: User = await this.usersService.findUser(email);

    if (user.groupName) {
      throw new BadRequestException('User is already in a group');
    }

    try {
      const newGroup = await this.groupModel.create({
        ...createGroupDto,
        groupLeader: email,
        members: [`${user.nickname}: ${user.email}`],
      });

      await this.userModel
        .findOneAndUpdate(
          { email },
          { groupName: createGroupDto.name, isGroupLeader: true },
          { new: true },
        )
        .lean()
        .exec();

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
    const group: Group = await this.groupModel
      .findOne({ name: groupName })
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

    const user = await this.userModel.findOne({ email });
    if (user.groupName) {
      throw new BadRequestException('User is already in a group');
    }

    const memberEntry = `${user.nickname}: ${user.email}`;
    group.members.push(memberEntry);

    user.groupName = group.name;
    group.inviteCode = null;

    await user.save();
    await group.save();

    return group.toObject();
  }

  async transferGroupLeadership(
    transferLeaderDto: TransferLeaderDto,
    email: string,
    groupName: string,
  ): Promise<Group> {
    const { newLeaderEmail } = transferLeaderDto;
    const group = await this.groupModel.findOne({ name: groupName });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const user = await this.userModel.findOne({ email });

    const newLeader = await this.userModel.findOne({
      email: new RegExp(`^${newLeaderEmail}$`, 'i'),
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
    newLeader.isGroupLeader = true;
    user.isGroupLeader = false;

    await user.save();
    await newLeader.save();
    await group.save();

    return group.toObject();
  }

  async leaveGroup(email: string): Promise<void> {
    const user = await this.userModel.findOne({
      email: new RegExp(`^${email}$`, 'i'),
    });
    if (!user.groupName) {
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

    user.groupName = null;
    user.isGroupLeader = false;
    await user.save();
  }

  async deleteGroup(groupName: string): Promise<void> {
    const group = await this.groupModel.findOne({ name: groupName });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.userModel.updateMany(
      { groupName: groupName },
      { $set: { groupName: null, isGroupLeader: false } },
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
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return plainToInstance(Group, group);
  }
}
