import { CreateGroupDto } from './dto/create-group.dto';
import { Group } from '../schemas/group.shema';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';

export interface IGroup {
  createGroup(email: string, createGroupDto: CreateGroupDto): Promise<Group>;

  getGroupByName(groupName: string): Promise<Group>;

  generateInviteCode(groupName: string): Promise<{ inviteCode: string }>;

  joinGroup(joinGroupDto: JoinGroupDto, email: string): Promise<Group>;

  transferGroupLeadership(
    transferLeaderDto: TransferLeaderDto,
    email: string,
    groupName: string,
  ): Promise<Group>;

  leaveGroup(email: string): Promise<void>;

  deleteGroup(groupName: string): Promise<void>;
}