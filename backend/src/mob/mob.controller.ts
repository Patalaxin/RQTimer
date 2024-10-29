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

@ApiTags('Mob API')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(TokensGuard)
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
  create(
    @Body() createMobDto: CreateMobDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    return this.mobService.createMob(createMobDto);
  }

  @Roles()
  @Get('/:server/:location/:mobName/')
  @ApiOperation({ summary: 'Get Mob' })
  getMobAndData(
    @Param() getMobDto: GetMobDtoRequest,
  ): Promise<GetFullMobWithUnixDtoResponse> {
    return this.mobService.findMob(getMobDto);
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
    @Req() request: Request,
    @Body() updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetFullMobDtoResponse =
      await this.mobService.updateMobByCooldown(
        parsedToken.nickname,
        parsedToken.role,
        updateMobByCooldownDto,
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
    @Req() request: Request,
    @Body() updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetFullMobDtoResponse =
      await this.mobService.updateMobDateOfDeath(
        parsedToken.nickname,
        parsedToken.role,
        updateMobDateOfDeathDto,
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
    @Req() request: Request,
    @Body() updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetFullMobDtoResponse =
      await this.mobService.updateMobDateOfRespawn(
        parsedToken.nickname,
        parsedToken.role,
        updateMobDateOfRespawnDto,
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
    @Param() deleteMobDtoParams: DeleteMobDtoParamsRequest,
  ): Promise<DeleteMobDtoResponse> {
    return this.mobService.deleteMob(deleteMobDtoParams);
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
    @Req() request: Request,
    @Param() respawnLostDtoParams: RespawnLostDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse> {
    const parsedToken = HelperClass.getNicknameAndRoleFromToken(
      request,
      this.jwtService,
    );
    const mob: GetFullMobDtoResponse = await this.mobService.respawnLost(
      respawnLostDtoParams,
      parsedToken.nickname,
      parsedToken.role,
    );

    this.mobGateway.sendMobUpdate({
      ...respawnLostDtoParams,
      ...mob,
      socketType: 'respawnLost',
    });

    return mob;
  }
}
