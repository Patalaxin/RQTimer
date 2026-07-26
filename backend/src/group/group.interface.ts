import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';

export interface IGroup {
  createGroup(
    email: string,
    createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto>;

  getGroupByName(groupName: string): Promise<GroupResponseDto>;

  generateInviteCode(groupName: string): Promise<{ inviteCode: string }>;

  joinGroup(
    joinGroupDto: JoinGroupDto,
    email: string,
  ): Promise<GroupResponseDto>;

  transferGroupLeadership(
    transferLeaderDto: TransferLeaderDto,
    email: string,
    groupName: string,
  ): Promise<GroupResponseDto>;

  leaveGroup(email: string): Promise<void>;

  deleteGroup(groupName: string): Promise<void>;

  updateGroup(
    groupName: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<GroupResponseDto>;
}
