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
import { Group, GroupDocument } from '../schemas/group.shema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';
import { UsersService } from '../users/users.service';
import { plainToInstance } from 'class-transformer';
import { MobService } from '../mob/mob.service';

@Injectable()
export class GroupService {
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
        members: [email],
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

    const user = await this.userModel.findOne({ email });
    if (user.groupName) {
      throw new BadRequestException('User is already in a group');
    }

    group.inviteCode = null;
    group.members.push(email);
    user.groupName = group.name;

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

    const newLeader = await this.userModel.findOne({ email: newLeaderEmail });
    if (!newLeader || !group.members.includes(newLeader.email)) {
      throw new NotFoundException('New leader not found in group');
    }

    group.groupLeader = newLeader.email;
    newLeader.isGroupLeader = true;

    user.isGroupLeader = false;

    await user.save();
    await newLeader.save();
    await group.save();

    return group.toObject();
  }

  async leaveGroup(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });
    if (!user.groupName) {
      throw new BadRequestException('User is not in a group');
    }

    const group = await this.groupModel.findOne({ name: user.groupName });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    group.members = group.members.filter((member) => member !== email);
    await group.save();

    user.groupName = null;
    await user.save();
  }

  async deleteGroup(groupName: string): Promise<void> {
    const group = await this.groupModel.findOne({ name: groupName });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.userModel.updateMany(
      { groupName: groupName },
      { $set: { group: null, isGroupLeader: false } },
    );

    await this.groupModel.deleteOne({ name: groupName });
    await this.mobService.deleteAllMobData(groupName);
  }
}
