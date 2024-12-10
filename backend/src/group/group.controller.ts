import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Delete,
  Inject,
  Param,
  Patch,
} from '@nestjs/common';
import { GetEmailFromToken } from '../decorators/getEmail.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokensGuard } from '../guards/tokens.guard';
import { Group } from '../schemas/group.schema';
import { GetGroupNameFromToken } from '../decorators/getGroupName.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { IGroup } from './group.interface';
import { UpdateGroupDto } from './dto/update-group.dto';
import { IsGroupLeaderGuard } from '../guards/isGroupLeader.guard';

@ApiTags('Groups API')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(TokensGuard, RolesGuard)
@Controller('groups')
export class GroupController {
  constructor(@Inject('IGroup') private readonly groupInterface: IGroup) {}

  @ApiOperation({ summary: 'Create Group' })
  @Post()
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @GetEmailFromToken() email: string,
  ): Promise<Group> {
    return this.groupInterface.createGroup(email, createGroupDto);
  }

  @ApiOperation({ summary: 'Get Own Group Info' })
  @Get()
  async getGroupByName(
    @GetGroupNameFromToken() groupName: string,
  ): Promise<Group> {
    return this.groupInterface.getGroupByName(groupName);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Generate Invite Code' })
  @Post('/invite')
  async generateInviteCode(
    @GetGroupNameFromToken() groupName: string,
  ): Promise<{ inviteCode: string }> {
    return this.groupInterface.generateInviteCode(groupName);
  }

  @ApiOperation({ summary: 'Join In Group' })
  @Post('join')
  async joinGroup(
    @Body() joinGroupDto: JoinGroupDto,
    @GetEmailFromToken() email: string,
  ): Promise<Group> {
    return this.groupInterface.joinGroup(joinGroupDto, email);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Transfer Leader' })
  @Post('transfer-leader')
  async transferGroupLeadership(
    @Body() transferLeaderDto: TransferLeaderDto,
    @GetEmailFromToken() email: string,
    @GetGroupNameFromToken() groupName: string,
  ): Promise<Group> {
    return this.groupInterface.transferGroupLeadership(
      transferLeaderDto,
      email,
      groupName,
    );
  }

  @ApiOperation({ summary: 'Leave Group' })
  @Post('leave')
  async leaveGroup(@GetEmailFromToken() email: string): Promise<void> {
    return this.groupInterface.leaveGroup(email);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Remove User From Group' })
  @Delete('/:email')
  async removeUserFromGroup(@Param('email') email: string): Promise<void> {
    return this.groupInterface.leaveGroup(email);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Delete Group' })
  @Delete()
  async deleteGroup(@GetGroupNameFromToken() groupName: string): Promise<void> {
    return this.groupInterface.deleteGroup(groupName);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Update Group' })
  @Patch()
  async updateGroup(
    @GetGroupNameFromToken() groupName: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    return this.groupInterface.updateGroup(groupName, updateGroupDto);
  }
}
