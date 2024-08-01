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
import { IMob } from '../domain/mob/mob.interface';
import { CreateMobDtoRequest } from './dto/create-mob.dto';
import {
  GetFullMobDtoResponse,
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

@ApiTags('Mob API')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(TokensGuard)
@Controller('mob')
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
  @Get('findMob/:mobName/:server/:location/')
  @ApiOperation({ summary: 'Get Mob' })
  getMobAndData(
    @Param() getMobDto: GetMobDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    return this.mobService.findMob(getMobDto);
  }

  @Roles()
  @ApiOperation({ summary: 'Find All User Mobs' })
  @Get('/:server/')
  findAllMobsByUser(
    @GetEmailFromToken() email: string,
    @Param() getMobsDto: GetMobsDtoRequest,
  ): Promise<GetFullMobDtoResponse[]> {
    return this.mobService.findAllMobsByUser(email, getMobsDto);
  }

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Update Mob' })
  @Put('/:mobName/:server/:location/')
  updateMob(
    @Body() updateMobDtoBody: UpdateMobDtoBodyRequest,
    @Param() updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<GetMobDtoResponse> {
    return this.mobService.updateMob(updateMobDtoBody, updateMobDtoParams);
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob by Cooldown Respawn Time' })
  @Put('/updateMobByCooldown')
  async updateMobByCooldown(
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
      );
    this.mobGateway.sendMobUpdate({
      ...mob,
      socketType: 'updateMobByCooldown',
    });
    return mob;
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Death' })
  @Put('/updateMobDateOfDeath')
  async updateMobDateOfDeath(
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
      );

    this.mobGateway.sendMobUpdate({
      ...mob,
      socketType: 'updateMobDateOfDeath',
    });

    return mob;
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Respawn' })
  @Put('/updateMobDateOfRespawn')
  async updateMobDateOfRespawn(
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
      );

    this.mobGateway.sendMobUpdate({
      ...mob,
      socketType: 'updateMobDateOfRespawn',
    });

    return mob;
  }

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Delete Mob' })
  @Delete(':mobName/:server/:location/')
  deleteOne(
    @Param() deleteMobDtoParams: DeleteMobDtoParamsRequest,
  ): Promise<DeleteMobDtoResponse> {
    return this.mobService.deleteMob(deleteMobDtoParams);
  }

  @Roles()
  @ApiOperation({ summary: 'Crash Mob Server' })
  @Post('/crashServer/:server')
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
  @Put('respawnLost/:mobName/:server/:location/')
  async respawnLost(
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
    );

    this.mobGateway.sendMobUpdate({
      ...mob,
      socketType: 'respawnLost',
    });

    return mob;
  }
}
