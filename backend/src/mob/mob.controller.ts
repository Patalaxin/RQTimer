import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { GetEmailFromToken } from '../decorators/getEmail.decorator';
import { Roles } from '../decorators/roles.decorator';
import { RolesTypes } from '../schemas/user.schema';
import { TokensGuard } from '../guards/tokens.guard';
import { IMob } from './mob.interface';
import { CreateMobDtoRequest } from './dto/create-mob.dto';
import {
  GetFullMobDtoResponse,
  GetFullMobWithUnixDtoResponse,
  GetMobDataDtoResponse,
  GetMobDtoRequest,
  GetMobDtoResponse,
} from './dto/get-mob.dto';
import { GetMobsDtoRequest } from './dto/get-all-mobs.dto';
import {
  UpdateMobDtoBodyRequest,
  UpdateMobDtoParamsRequest,
} from './dto/update-mob.dto';
import { UpdateMobByCooldownDtoRequest } from './dto/update-mob-by-cooldown.dto';
import { UpdateMobDateOfDeathDtoRequest } from './dto/update-mob-date-of-death.dto';
import { UpdateMobDateOfRespawnDtoRequest } from './dto/update-mob-date-of-respawn.dto';
import {
  DeleteMobDtoParamsRequest,
  DeleteMobDtoResponse,
} from './dto/delete-mob.dto';
import { HelperClass } from '../helper-class';
import { JwtService } from '@nestjs/jwt';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import { CrashServerDtoParamsRequest } from './dto/crash-server.dto';
import { MobGateway } from './mob.gateway';
import { Mob } from '../schemas/mob.schema';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { MobsData } from '../schemas/mobsData.schema';
import { GetGroupNameFromToken } from '../decorators/getGroupName.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { IsGroupLeaderGuard } from '../guards/isGroupLeader.guard';
import { IsGroupLeader } from '../decorators/isGroupLeader.decorator';

@ApiTags('Mob API')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(TokensGuard, RolesGuard, IsGroupLeaderGuard)
@Controller('mobs')
export class MobController {
  constructor(
    @Inject('IMob') private readonly mobService: IMob,
    private jwtService: JwtService,
    private mobGateway: MobGateway,
  ) {}

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Create Mob' })
  @Post()
  create(@Body() createMobDto: CreateMobDtoRequest): Promise<Mob> {
    return this.mobService.createMob(createMobDto);
  }

  @IsGroupLeader()
  @ApiOperation({ summary: 'Add Mob In Group' })
  @Post('/add-mob-in-group/:server/:location/:mobName/')
  addMobInGroup(
    @Param() addMobInGroupDto: AddMobInGroupDtoRequest,
    @GetGroupNameFromToken() groupName: string,
  ): Promise<MobsData> {
    return this.mobService.addMobInGroup(addMobInGroupDto, groupName);
  }

  @Roles()
  @Get('/:server/:location/:mobName/')
  @ApiOperation({ summary: 'Get Mob' })
  getMobAndData(
    @GetGroupNameFromToken() groupName: string,
    @Param() getMobDto: GetMobDtoRequest,
  ): Promise<GetFullMobWithUnixDtoResponse> {
    return this.mobService.findMob(getMobDto, groupName);
  }

  @Roles()
  @ApiOperation({ summary: 'Find All User Mobs' })
  @Get('/:server/')
  findAllMobsByUser(
    @GetEmailFromToken() email: string,
    @Param() getMobsDto: GetMobsDtoRequest,
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    return this.mobService.findAllMobsByUser(email, getMobsDto);
  }

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Update Mob' })
  @Put('/:server/:location/:mobName/')
  updateMob(
    @Body() updateMobDtoBody: UpdateMobDtoBodyRequest,
    @Param() updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<GetMobDtoResponse> {
    return this.mobService.updateMob(updateMobDtoBody, updateMobDtoParams);
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob by Cooldown Respawn Time' })
  @Put('/cooldown')
  async updateMobByCooldown(
    @GetGroupNameFromToken() groupName: string,
    @Req() request: Request,
    @Body() updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetMobDataDtoResponse =
      await this.mobService.updateMobByCooldown(
        parsedToken.nickname,
        parsedToken.role,
        updateMobByCooldownDto,
        groupName,
      );
    this.mobGateway.sendMobUpdate({
      ...updateMobByCooldownDto,
      ...mob,
      socketType: 'updateMobByCooldown',
    });
    return mob;
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Death' })
  @Put('/date-of-death')
  async updateMobDateOfDeath(
    @GetGroupNameFromToken() groupName: string,
    @Req() request: Request,
    @Body() updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetMobDataDtoResponse =
      await this.mobService.updateMobDateOfDeath(
        parsedToken.nickname,
        parsedToken.role,
        updateMobDateOfDeathDto,
        groupName,
      );

    this.mobGateway.sendMobUpdate({
      ...updateMobDateOfDeathDto,
      ...mob,
      socketType: 'updateMobDateOfDeath',
    });

    return mob;
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Respawn' })
  @Put('/date-of-respawn')
  async updateMobDateOfRespawn(
    @GetGroupNameFromToken() groupName: string,
    @Req() request: Request,
    @Body() updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetMobDataDtoResponse =
      await this.mobService.updateMobDateOfRespawn(
        parsedToken.nickname,
        parsedToken.role,
        updateMobDateOfRespawnDto,
        groupName,
      );

    this.mobGateway.sendMobUpdate({
      ...updateMobDateOfRespawnDto,
      ...mob,
      socketType: 'updateMobDateOfRespawn',
    });

    return mob;
  }

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Delete Mob' })
  @Delete(':server/:location/:mobName/')
  deleteOne(
    @GetGroupNameFromToken() groupName: string,
    @Param() deleteMobDtoParams: DeleteMobDtoParamsRequest,
  ): Promise<DeleteMobDtoResponse> {
    return this.mobService.deleteMob(deleteMobDtoParams, groupName);
  }

  @Roles()
  @ApiOperation({ summary: 'Crash Mob Server' })
  @Post('/crash-server/:server')
  async crashServer(
    @GetEmailFromToken() email: string,
    @Req() request: Request,
    @Param() crashServerDtoParams: CrashServerDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse[]> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetFullMobDtoResponse[] = await this.mobService.crashMobServer(
      email,
      parsedToken.nickname,
      parsedToken.role,
      crashServerDtoParams.server,
    );

    this.mobGateway.sendMobUpdate({
      ...mob,
      socketType: 'crashServer',
    });

    return mob;
  }

  @Roles()
  @ApiOperation({ summary: 'Mob Respawn Lost' })
  @Put('respawn-lost/:server/:location/:mobName/')
  async respawnLost(
    @GetGroupNameFromToken() groupName: string,
    @Req() request: Request,
    @Param() respawnLostDtoParams: RespawnLostDtoParamsRequest,
  ): Promise<GetMobDataDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetMobDataDtoResponse = await this.mobService.respawnLost(
      respawnLostDtoParams,
      parsedToken.nickname,
      parsedToken.role,
      groupName,
    );

    this.mobGateway.sendMobUpdate({
      ...respawnLostDtoParams,
      ...mob,
      socketType: 'respawnLost',
      groupName,
    });

    return mob;
  }
}
