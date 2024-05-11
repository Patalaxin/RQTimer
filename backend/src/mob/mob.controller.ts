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
import { UsersGuard } from '../guards/users.guard';
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
import { UpdateMobCooldownDtoRequest } from './dto/update-mob-cooldown.dto';
import {
  DeleteMobDtoParamsRequest,
  DeleteMobDtoResponse,
} from './dto/delete-mob.dto';
import { HelperClass } from '../helper-class';
import { JwtService } from '@nestjs/jwt';
import { RespawnLostDtoParamsRequest } from "./dto/respawn-lost.dto";
import { CrashServerDtoParamsRequest } from "./dto/crash-server.dto";

@ApiTags('Mob API')
@ApiBearerAuth()
@UseGuards(UsersGuard)
@Controller('mob')
export class MobController {
  constructor(
    @Inject('IMob') private readonly mobService: IMob,
    private jwtService: JwtService,
  ) {}

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create Mob' })
  @Post()
  create(
    @Body() createMobDto: CreateMobDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    return this.mobService.createMob(createMobDto);
  }

  @Get('findMob/:mobName/:server/:location/')
  @UseInterceptors(ClassSerializerInterceptor)
  getMobAndData(
    @Param() getMobDto: GetMobDtoRequest,
  ): Promise<GetFullMobDtoResponse> {
    return this.mobService.findMob(getMobDto);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Find All User Mobs' })
  @Get('findAll/:server/')
  findAllMobsByUser(
    @GetEmailFromToken() email: string,
    @Param() getMobsDto: GetMobsDtoRequest,
  ): Promise<GetFullMobDtoResponse[]> {
    return this.mobService.findAllMobsByUser(email, getMobsDto);
  }

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Mob' })
  @Put('/updateMob/:mobName/:server/:location/')
  updateMob(
    @Body() updateMobDtoBody: UpdateMobDtoBodyRequest,
    @Param() updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<GetMobDtoResponse> {
    return this.mobService.updateMob(updateMobDtoBody, updateMobDtoParams);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Mob by Cooldown Respawn Time' })
  @Put('/updateMobByCooldown')
  updateMobByCooldown(
    @Req() request: Request,
    @Body() updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    return this.mobService.updateMobByCooldown(
      nickname,
      updateMobByCooldownDto,
    );
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Death' })
  @Put('/updateMobDateOfDeath')
  updateMobDateOfDeath(
    @Req() request: Request,
    @Body() updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    return this.mobService.updateMobDateOfDeath(
      nickname,
      updateMobDateOfDeathDto,
    );
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Respawn' })
  @Put('/updateMobDateOfRespawn')
  updateMobDateOfRespawn(
    @Req() request: Request,
    @Body() updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    return this.mobService.updateMobDateOfRespawn(
      nickname,
      updateMobDateOfRespawnDto,
    );
  }

  @Roles()
  @ApiOperation({ summary: 'Update Mob Cooldown Counter ' })
  @Put('/updateMobCooldownCounter')
  updateMobCooldownCounter(
    @Body() updateMobCooldownDto: UpdateMobCooldownDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    return this.mobService.updateMobCooldownCounter(updateMobCooldownDto);
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
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Crash Mob Server' })
  @Post('/crashServer/:server')
  crashServer(
    @GetEmailFromToken() email: string,
    @Req() request: Request,
    @Param() crashServerDtoParams: CrashServerDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse[]> {
    const nickname: string = HelperClass.getNicknameFromToken(
      request,
      this.jwtService,
    );
    return this.mobService.crashMobServer(email, nickname, crashServerDtoParams.server);
  }

  @Roles()
  @ApiOperation({ summary: 'Mob Respawn Lost' })
  @Put('respawnLost/:mobName/:server/:location/')
  respawnLost(
    @Param() respawnLostDtoParams: RespawnLostDtoParamsRequest,
  ): Promise<GetMobDataDtoResponse> {
    return this.mobService.respawnLost(respawnLostDtoParams);
  }
}
