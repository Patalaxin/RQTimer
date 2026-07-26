import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../decorators/get-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { RolesTypes } from '../schemas/user.schema';
import { TokensGuard } from '../guards/tokens.guard';
import { IMob } from './mob.interface';
import { CreateMobDtoRequest } from './dto/create-mob.dto';
import {
  GetFullMobDtoResponse,
  GetFullMobWithUnixDtoResponse,
  GetMobDtoRequest,
  GetMobDtoResponse,
  GetMobInGroupDtoRequest,
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
import { MobGateway } from './mob.gateway';
import { MobDto } from './dto/mob.dto';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { MobsDataDto } from './dto/mob.dto';
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
    private readonly mobGateway: MobGateway,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Create Mob' })
  @Post()
  create(@Body() createMobDto: CreateMobDtoRequest): Promise<MobDto> {
    return this.mobInterface.createMob(createMobDto);
  }

  @ApiOperation({ summary: 'Add Mob In Group' })
  @Post('/:server/add-in-group/')
  addMobInGroup(
    @GetUser('email') email: string,
    @Param('server') server: Servers,
    @Body() addMobInGroupDto: AddMobInGroupDtoRequest,
    @GetUser('groupName') groupName: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    return this.mobInterface.addMobInGroup(
      email,
      server,
      addMobInGroupDto,
      groupName,
    );
  }

  @Roles()
  @Get('/:mobId/')
  @ApiExtraModels(MobDto, MobsDataDto, GetFullMobWithUnixDtoResponse)
  @ApiOperation({ summary: 'Get Mob' })
  @Header('Cache-Control', 'public, max-age=86400, immutable')
  getMob(
    @Param() getMobDto: GetMobDtoRequest,
    @Query('lang') lang: string = 'ru',
  ): Promise<GetMobDtoResponse> {
    return this.mobInterface.getMob(getMobDto, lang);
  }

  @Roles()
  @Get('/group/:server/:mobId/')
  @ApiExtraModels(MobDto, MobsDataDto, GetFullMobWithUnixDtoResponse)
  @ApiOperation({ summary: 'Get Mob From Group' })
  getMobFromGroup(
    @GetUser('groupName') groupName: string,
    @Param() getMobDto: GetMobInGroupDtoRequest,
    @Query('lang') lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse> {
    return this.mobInterface.getMobFromGroup(getMobDto, groupName, lang);
  }

  @Roles()
  @ApiOperation({ summary: 'Find All User Mobs' })
  @Get('/server/:server/')
  findAllMobsByUser(
    @GetUser('groupName') groupName: string,
    @Param() getMobsDto: GetMobsDtoRequest,
    @Query('lang') lang: string = 'ru',
  ): Promise<GetFullMobWithUnixDtoResponse[]> {
    return this.mobInterface.findAllGroupMobs(getMobsDto, groupName, lang);
  }

  @Roles()
  @ApiOperation({ summary: 'Find All Available Mobs' })
  @Header('Cache-Control', 'public, max-age=3600')
  @Get()
  findAllAvailableMobs(@Query('lang') lang: string = 'ru'): Promise<MobDto[]> {
    return this.mobInterface.findAllAvailableMobs(lang);
  }

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Update Mob' })
  @Put('/:mobId/')
  updateMob(
    @Body() updateMobDtoBody: UpdateMobDtoBodyRequest,
    @Param() updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<MobDto> {
    return this.mobInterface.updateMob(updateMobDtoBody, updateMobDtoParams);
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob by Cooldown Respawn Time' })
  @Put('/:server/:mobId/cooldown')
  async updateMobByCooldown(
    @GetUser('groupName') groupName: string,
    @GetUser('nickname') nickname: string,
    @GetUser('role') role: RolesTypes,
    @Param('mobId') mobId: string,
    @Param('server') server: Servers,
    @Body() updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const mob: GetFullMobDtoResponse =
      await this.mobInterface.updateMobByCooldown(
        nickname,
        role,
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
    @GetUser('groupName') groupName: string,
    @GetUser('nickname') nickname: string,
    @GetUser('role') role: RolesTypes,
    @Param('mobId') mobId: string,
    @Param('server') server: Servers,
    @Body() updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const mob: GetFullMobDtoResponse =
      await this.mobInterface.updateMobDateOfDeath(
        nickname,
        role,
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
    @GetUser('groupName') groupName: string,
    @GetUser('nickname') nickname: string,
    @GetUser('role') role: RolesTypes,
    @Param('mobId') mobId: string,
    @Param('server') server: Servers,
    @Body() updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const mob: GetFullMobDtoResponse =
      await this.mobInterface.updateMobDateOfRespawn(
        nickname,
        role,
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
    @GetUser('groupName') groupName: string,
    @Param() removeMobDtoParams: RemoveMobFromGroupDtoParamsRequest,
  ): Promise<RemoveMobFromGroupDtoResponse> {
    return this.mobInterface.removeMobFromGroup(removeMobDtoParams, groupName);
  }

  @Roles()
  @ApiOperation({ summary: 'Crash Mob Server' })
  @Post('/:server/crash-server/')
  async crashServer(
    @GetUser('groupName') groupName: string,
    @GetUser('nickname') nickname: string,
    @GetUser('role') role: RolesTypes,
    @Param() crashServerDtoParams: CrashServerDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse[]> {
    const mob: GetFullMobDtoResponse[] = await this.mobInterface.crashMobServer(
      groupName,
      nickname,
      role,
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
    @GetUser('groupName') groupName: string,
    @GetUser('nickname') nickname: string,
    @GetUser('role') role: RolesTypes,
    @Param() respawnLostDtoParams: RespawnLostDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse> {
    const mob: GetFullMobDtoResponse = await this.mobInterface.respawnLost(
      respawnLostDtoParams,
      nickname,
      role,
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
    @GetUser('groupName') groupName: string,
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
