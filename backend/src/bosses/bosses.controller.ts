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
  UpdateBossDtoBodyResponse,
  UpdateBossDtoParamsRequest,
} from './dto/update-boss.dto';
import {
  CreateBossDtoRequest,
  CreateBossDtoResponse,
} from './dto/create-boss.dto';
import {
  UpdateBossDeathDtoRequest,
  UpdateBossDeathDtoResponse,
} from './dto/update-boss-death.dto';
import {
  GetBossesDtoRequest,
  GetBossesDtoResponse,
} from './dto/get-bosses.dto';
import { DeleteBossDtoResponse } from './dto/delete-boss.dto';
import { UsersGuard } from '../guards/users.guard';
import { UpdateBossCooldownDtoRequest, UpdateBossCooldownDtoResponse } from "./dto/update-boss-cooldown.dto";
import { RespawnLostBossDtoResponse } from "./dto/respawnLost-boss.dto";

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
  ): Promise<CreateBossDtoResponse> {
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
  ): Promise<GetBossesDtoResponse[]> {
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
  ): Promise<UpdateBossDtoBodyResponse> {
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
  @ApiOperation({ summary: 'Update Boss Respawn Time' })
  @Put('/updateDeathOfBoss')
  async updateDeathOfBoss(
    @Req() request: Request,
    @Body() updateBossDeathDto: UpdateBossDeathDtoRequest,
  ): Promise<UpdateBossDeathDtoResponse> {
    return await this.bossService.updateDeathOfBoss(
      request,
      updateBossDeathDto,
    );
  }

  @Roles()
  @ApiOperation({ summary: 'Update Boss Cooldown Counter ' })
  @Put('/updateCooldownCounter')
  async updateCooldownCounter(
    @Body() updateBossCooldownDtoRequest: UpdateBossCooldownDtoRequest
  ): Promise<UpdateBossCooldownDtoResponse> {
    return await this.bossService.updateCooldownCounterBoss(updateBossCooldownDtoRequest);
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
  ): Promise<GetBossesDtoResponse[]> {
    return this.bossService.crashBossServer(request, server);
  }

  @Roles()
  @ApiOperation({ summary: 'Boss Respawn Lost' })
  @Put('respawnLost/:bossName/:server')
  async respawnLost(
    @Param('bossName') bossName: BossTypes,
    @Param('server') server: Servers,
  ): Promise<RespawnLostBossDtoResponse[]> {
    return await this.bossService.respawnLost(server, bossName);
  }
}
