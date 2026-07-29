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
import { GetUser } from '../decorators/get-user.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { TransferLeaderDto } from './dto/transfer-leader-group.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokensGuard } from '../guards/tokens.guard';
import { GroupResponseDto } from './dto/group-response.dto';
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
    @GetUser('email') email: string,
  ): Promise<GroupResponseDto> {
    return this.groupInterface.createGroup(email, createGroupDto);
  }

  @ApiOperation({ summary: 'Get Own Group Info' })
  @Get()
  async getGroupByName(
    @GetUser('groupName') groupName: string,
  ): Promise<GroupResponseDto> {
    return this.groupInterface.getGroupByName(groupName);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Generate Invite Code' })
  @Post('/invite')
  async generateInviteCode(
    @GetUser('groupName') groupName: string,
  ): Promise<{ inviteCode: string }> {
    return this.groupInterface.generateInviteCode(groupName);
  }

  @ApiOperation({ summary: 'Join In Group' })
  @Post('join')
  async joinGroup(
    @Body() joinGroupDto: JoinGroupDto,
    @GetUser('email') email: string,
  ): Promise<GroupResponseDto> {
    return this.groupInterface.joinGroup(joinGroupDto, email);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Transfer Leader' })
  @Post('transfer-leader')
  async transferGroupLeadership(
    @Body() transferLeaderDto: TransferLeaderDto,
    @GetUser('email') email: string,
    @GetUser('groupName') groupName: string,
  ): Promise<GroupResponseDto> {
    return this.groupInterface.transferGroupLeadership(
      transferLeaderDto,
      email,
      groupName,
    );
  }

  @ApiOperation({ summary: 'Leave Group' })
  @Post('leave')
  async leaveGroup(@GetUser('email') email: string): Promise<void> {
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
  async deleteGroup(@GetUser('groupName') groupName: string): Promise<void> {
    return this.groupInterface.deleteGroup(groupName);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Update Group' })
  @Patch()
  async updateGroup(
    @GetUser('groupName') groupName: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupInterface.updateGroup(groupName, updateGroupDto);
  }
}
