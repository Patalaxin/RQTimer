import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
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
import { BossesService } from './bosses.service';
import { RolesTypes } from '../schemas/user.schema';
import { GranasBoss } from '../schemas/granasBosses.schema';
import { BossTypes, Servers } from '../schemas/mobs.enum';
import { GetBossDtoRequest, GetBossDtoResponse } from './dto/get-boss.dto';
import {
  UpdateBossDtoBodyRequest,
  UpdateBossDtoParamsRequest,
} from './dto/update-boss.dto';
import {
  CreateBossDtoRequest,
} from './dto/create-boss.dto';
import {
  GetBossesDtoRequest,
} from './dto/get-bosses.dto';
import { DeleteBossDtoResponse } from './dto/delete-boss.dto';
import { UsersGuard } from '../guards/users.guard';
import {
  UpdateBossCooldownDtoRequest,
} from './dto/update-boss-cooldown.dto';
import { UpdateBossByCooldownDtoRequest } from './dto/update-boss-by-cooldown.dto';
import { UpdateBossDateOfDeathDtoRequest } from './dto/update-boss-date-of-death.dto';
import { UpdateBossDateOfRespawnDtoRequest } from './dto/update-boss-date-of-respawn.dto';

@ApiTags('Boss API')
@ApiBearerAuth()
@UseGuards(UsersGuard)
@Controller('boss')
export class BossesController {
  constructor(private bossService: BossesService) {}

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create Boss' })
  @Post('/create')
  async create(
    @Body() createBossDto: CreateBossDtoRequest,
  ): Promise<GetBossDtoResponse> {
    return new GranasBoss(await this.bossService.createBoss(createBossDto));
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Find Boss' })
  @Get('findBoss/:bossName/:server/')
  async getOneBoss(
    @Param() getBossDto: GetBossDtoRequest,
  ): Promise<GetBossDtoResponse> {
    return await this.bossService.findBoss(getBossDto);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Find All User Bosses' })
  @Get('findAll/:server/')
  async findAllBossesByUser(
    @GetEmailFromToken() email: string,
    @Param() getBossesDtoRequest: GetBossesDtoRequest,
  ): Promise<GetBossDtoResponse[]> {
    return await this.bossService.findAllBossesByUser(
      email,
      getBossesDtoRequest,
    );
  }

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Boss' })
  @Put('/updateBoss/:bossName/:server/')
  async updateBoss(
    @Body() updateBossDto: UpdateBossDtoBodyRequest,
    @Param() updateBossDtoParamsRequest: UpdateBossDtoParamsRequest,
  ): Promise<GetBossDtoResponse> {
    try {
      return await this.bossService.updateBoss(
        updateBossDtoParamsRequest,
        updateBossDto,
      );
    } catch (error) {
      throw new HttpException('Boss not updated', HttpStatus.BAD_REQUEST);
    }
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Boss by Cooldown Respawn Time' })
  @Put('/updateBossByCooldown')
  async updateBossByCooldown(
    @Req() request: Request,
    @Body() updateBossByCooldownDto: UpdateBossByCooldownDtoRequest,
  ): Promise<GetBossDtoResponse> {
    return await this.bossService.updateBossByCooldown(
      request,
      updateBossByCooldownDto,
    );
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Boss Respawn Time by Date of Death' })
  @Put('/updateBossDateOfDeath')
  async updateBossDateOfDeath(
    @Req() request: Request,
    @Body() updateBossDateOfDeathDto: UpdateBossDateOfDeathDtoRequest,
  ): Promise<GetBossDtoResponse> {
    return await this.bossService.updateBossDateOfDeath(
      request,
      updateBossDateOfDeathDto,
    );
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Boss Respawn Time by Date of Respawn' })
  @Put('/updateBossDateOfRespawn')
  async updateBossDateOfRespawn(
    @Req() request: Request,
    @Body() updateBossDateOfRespawnDto: UpdateBossDateOfRespawnDtoRequest,
  ): Promise<GetBossDtoResponse> {
    return await this.bossService.updateBossDateOfRespawn(
      request,
      updateBossDateOfRespawnDto,
    );
  }

  @Roles()
  @ApiOperation({ summary: 'Update Boss Cooldown Counter ' })
  @Put('/updateCooldownCounter')
  async updateCooldownCounter(
    @Body() updateBossCooldownDtoRequest: UpdateBossCooldownDtoRequest,
  ): Promise<GetBossDtoResponse> {
    return await this.bossService.updateCooldownCounterBoss(
      updateBossCooldownDtoRequest,
    );
  }

  @Roles(RolesTypes.Admin)
  @ApiOperation({ summary: 'Delete Boss' })
  @Delete(':bossName/:server')
  async deleteOne(
    @Param('bossName') bossName: BossTypes,
    @Param('server') server: Servers,
  ): Promise<DeleteBossDtoResponse> {
    return await this.bossService.deleteBoss(server, bossName);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Crash Boss Server' })
  @Post('/crashServer/:server')
  async crashServer(
    @Req() request: Request,
    @Param('server') server: Servers,
  ): Promise<GetBossDtoResponse[]> {
    return this.bossService.crashBossServer(request, server);
  }

  @Roles()
  @ApiOperation({ summary: 'Boss Respawn Lost' })
  @Put('respawnLost/:bossName/:server')
  async respawnLost(
    @Param('bossName') bossName: BossTypes,
    @Param('server') server: Servers,
  ): Promise<GetBossDtoResponse[]> {
    return await this.bossService.respawnLost(server, bossName);
  }
}
