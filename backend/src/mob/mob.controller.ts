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
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  GetMobDtoRequest,
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
  DeleteMobDtoResponse,
  RemoveMobFromGroupDtoParamsRequest,
  RemoveMobFromGroupDtoResponse,
} from './dto/delete-mob.dto';
import { HelperClass } from '../helper-class';
import { JwtService } from '@nestjs/jwt';
import { MobGateway } from './mob.gateway';
import { Mob } from '../schemas/mob.schema';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { MobsData } from '../schemas/mobsData.schema';
import { GetGroupNameFromToken } from '../decorators/getGroupName.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { IsGroupLeaderGuard } from '../guards/isGroupLeader.guard';
import { Servers } from '../schemas/mobs.enum';
import { TelegramBotService } from '../bot/telegram-bot.service';
import { CrashServerDtoParamsRequest } from './dto/crash-server.dto';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import {
  UpdateMobCommentDtoBodyRequest,
  UpdateMobCommentDtoParamsRequest,
} from './dto/update-mob-comment.dto';

@ApiTags('Mobs API')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(TokensGuard, RolesGuard)
@Controller('mobs')
export class MobController {
  constructor(
    @Inject('IMob') private readonly mobInterface: IMob,
    private jwtService: JwtService,
    private mobGateway: MobGateway,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Create Mob' })
  @Post()
  create(@Body() createMobDto: CreateMobDtoRequest): Promise<Mob> {
    return this.mobInterface.createMob(createMobDto);
  }

  @ApiOperation({ summary: 'Add Mob In Group' })
  @Post('/:server/add-in-group/')
  addMobInGroup(
    @GetEmailFromToken() email: string,
    @Param('server') server: Servers,
    @Body() addMobInGroupDto: AddMobInGroupDtoRequest,
    @GetGroupNameFromToken() groupName: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    return this.mobInterface.addMobInGroup(
      email,
      server,
      addMobInGroupDto,
      groupName,
    );
  }

  @Roles()
  @Get('/:server/:mobId/')
  @ApiExtraModels(Mob, MobsData, GetFullMobWithUnixDtoResponse)
  @ApiOperation({ summary: 'Get Mob' })
  getMobAndData(
    @GetGroupNameFromToken() groupName: string,
    @Param() getMobDto: GetMobDtoRequest,
    @Query('lang') lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse> {
    return this.mobInterface.getMobFromGroup(getMobDto, groupName, lang);
  }

  @Roles()
  @ApiOperation({ summary: 'Find All User Mobs' })
  @Get('/:server/')
  findAllMobsByUser(
    @GetEmailFromToken() email: string,
    @Param() getMobsDto: GetMobsDtoRequest,
    @Query('lang') lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    return this.mobInterface.findAllMobsByUser(email, getMobsDto, lang);
  }

  @Roles()
  @ApiOperation({ summary: 'Find All Available Mobs' })
  @Get()
  findAllAvailableMobs(@Query('lang') lang: string = 'ru'): Promise<Mob[]> {
    return this.mobInterface.findAllAvailableMobs(lang);
  }

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Update Mob' })
  @Put('/:mobId/')
  updateMob(
    @Body() updateMobDtoBody: UpdateMobDtoBodyRequest,
    @Param() updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<Mob> {
    return this.mobInterface.updateMob(updateMobDtoBody, updateMobDtoParams);
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob by Cooldown Respawn Time' })
  @Put('/:server/:mobId/cooldown')
  async updateMobByCooldown(
    @GetGroupNameFromToken() groupName: string,
    @Req() request: Request,
    @Param('mobId') mobId: string,
    @Param('server') server: Servers,
    @Body() updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );

    const mob: GetFullMobDtoResponse =
      await this.mobInterface.updateMobByCooldown(
        parsedToken.nickname,
        parsedToken.role,
        mobId,
        server,
        updateMobByCooldownDto,
        groupName,
      );

    this.mobGateway.sendMobUpdate({
      ...updateMobByCooldownDto,
      ...mob,
      socketType: 'updateMobByCooldown',
      groupName,
    });

    this.telegramBotService.notifyGroupUsers(
      groupName,
      server,
      mob.mob.mobName,
      mob.mob.location,
    );

    return mob;
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Death' })
  @Put('/:server/:mobId/date-of-death')
  async updateMobDateOfDeath(
    @GetGroupNameFromToken() groupName: string,
    @Req() request: Request,
    @Param('mobId') mobId: string,
    @Param('server') server: Servers,
    @Body() updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetFullMobDtoResponse =
      await this.mobInterface.updateMobDateOfDeath(
        parsedToken.nickname,
        parsedToken.role,
        mobId,
        server,
        updateMobDateOfDeathDto,
        groupName,
      );

    this.mobGateway.sendMobUpdate({
      ...updateMobDateOfDeathDto,
      ...mob,
      socketType: 'updateMobDateOfDeath',
      groupName,
    });

    this.telegramBotService.notifyGroupUsers(
      groupName,
      server,
      mob.mob.mobName,
      mob.mob.location,
    );

    return mob;
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Respawn' })
  @Put('/:server/:mobId/date-of-respawn')
  async updateMobDateOfRespawn(
    @GetGroupNameFromToken() groupName: string,
    @Req() request: Request,
    @Param('mobId') mobId: string,
    @Param('server') server: Servers,
    @Body() updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );

    const mob: GetFullMobDtoResponse =
      await this.mobInterface.updateMobDateOfRespawn(
        parsedToken.nickname,
        parsedToken.role,
        mobId,
        server,
        updateMobDateOfRespawnDto,
        groupName,
      );

    this.mobGateway.sendMobUpdate({
      ...updateMobDateOfRespawnDto,
      ...mob,
      socketType: 'updateMobDateOfRespawn',
      groupName,
    });

    this.telegramBotService.notifyGroupUsers(
      groupName,
      server,
      mob.mob.mobName,
      mob.mob.location,
    );

    return mob;
  }

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Delete Mob' })
  @Delete('/:mobId/')
  deleteOne(@Param('mobId') mobId: string): Promise<DeleteMobDtoResponse> {
    return this.mobInterface.deleteMob(mobId);
  }

  @UseGuards(IsGroupLeaderGuard)
  @ApiOperation({ summary: 'Remove Mob From Group' })
  @Delete('/:server/:mobId/remove-from-group/')
  removeOneFromGroup(
    @GetGroupNameFromToken() groupName: string,
    @Param() removeMobDtoParams: RemoveMobFromGroupDtoParamsRequest,
  ): Promise<RemoveMobFromGroupDtoResponse> {
    return this.mobInterface.removeMobFromGroup(removeMobDtoParams, groupName);
  }

  @Roles()
  @ApiOperation({ summary: 'Crash Mob Server' })
  @Post('/:server/crash-server/')
  async crashServer(
    @GetGroupNameFromToken() groupName: string,
    @GetEmailFromToken() email: string,
    @Req() request: Request,
    @Param() crashServerDtoParams: CrashServerDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse[]> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetFullMobDtoResponse[] = await this.mobInterface.crashMobServer(
      groupName,
      email,
      parsedToken.nickname,
      parsedToken.role,
      crashServerDtoParams.server,
    );

    this.mobGateway.sendMobUpdate({
      ...mob,
      socketType: 'crashServer',
      groupName,
    });

    return mob;
  }

  @Roles()
  @ApiOperation({ summary: 'Mob Respawn Lost' })
  @Put('/:server/:mobId/respawn-lost/')
  async respawnLost(
    @GetGroupNameFromToken() groupName: string,
    @Req() request: Request,
    @Param() respawnLostDtoParams: RespawnLostDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetFullMobDtoResponse = await this.mobInterface.respawnLost(
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

  @Roles()
  @ApiOperation({ summary: 'Update Mob Comment Data' })
  @Put('/:server/:mobId/comment/')
  updateMobComment(
    @GetGroupNameFromToken() groupName: string,
    @Body() updateMobCommentBody: UpdateMobCommentDtoBodyRequest,
    @Param() updateMobCommentParams: UpdateMobCommentDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse> {
    return this.mobInterface.updateMobComment(
      groupName,
      updateMobCommentBody,
      updateMobCommentParams,
    );
  }
}
