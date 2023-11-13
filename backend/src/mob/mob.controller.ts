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
import { Locations, MobName, Servers } from '../schemas/mobs.enum';
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
import { DeleteMobDtoResponse } from './dto/delete-mob.dto';

@ApiTags('Mob API')
@ApiBearerAuth()
@UseGuards(UsersGuard)
@Controller('mob')
export class MobController {
  constructor(@Inject('IMob') private readonly mobService: IMob) {}

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create Mob' })
  @Post('/create')
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
    return this.mobService.updateMobByCooldown(request, updateMobByCooldownDto);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Mob Respawn Time by Date of Death' })
  @Put('/updateMobDateOfDeath')
  updateMobDateOfDeath(
    @Req() request: Request,
    @Body() updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetMobDataDtoResponse> {
    return this.mobService.updateMobDateOfDeath(
      request,
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
    return this.mobService.updateMobDateOfRespawn(
      request,
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
    @Param('mobName') mobName: MobName,
    @Param('server') server: Servers,
    @Param('location') location: Locations,
  ): Promise<DeleteMobDtoResponse> {
    return this.mobService.deleteMob(mobName, server, location);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Crash Mob Server' })
  @Post('/crashServer/:server')
  crashServer(
    @GetEmailFromToken() email: string,
    @Req() request: Request,
    @Param('server') server: Servers,
  ): Promise<GetFullMobDtoResponse[]> {
    return this.mobService.crashMobServer(email, request, server);
  }

  @Roles()
  @ApiOperation({ summary: 'Mob Respawn Lost' })
  @Put('respawnLost/:mobName/:server/:location/')
  respawnLost(
    @Param('mobName') mobName: MobName,
    @Param('server') server: Servers,
    @Param('location') location: Locations,
  ): Promise<GetMobDataDtoResponse> {
    return this.mobService.respawnLost(server, mobName, location);
  }
}
