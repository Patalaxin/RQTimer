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
  Put, Req,
  UseInterceptors
} from "@nestjs/common";
import { Request } from "express";
import { Roles } from '../decorators/roles.decorator';
import { BossesService } from './bosses.service';
import { RolesTypes } from '../schemas/user.schema';
import { GranasBoss } from '../schemas/granasBosses.schema';
import { BossTypes, Servers } from '../schemas/bosses.enum';
import { GetBossDto } from './dto/get-boss.dto';
import { UpdateBossDto } from './dto/update-boss.dto';
import { CreateBossDto } from './dto/create-boss.dto';
import { UpdateBossDeathDto } from "./dto/update-boss-death.dto";

// @UseGuards(UsersGuard)
@Controller('boss')
export class BossesController {
  constructor(private bossService: BossesService) {}

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/create')
  async create(@Body() createBossDto: CreateBossDto) {
    try {
      return new GranasBoss(await this.bossService.createBoss(createBossDto));
    } catch (error) {
      throw new HttpException('Boss not created', HttpStatus.BAD_REQUEST);
    }
  }

  @Roles(RolesTypes.User, RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':bossName/:server/')
  async getOneBoss(@Param() getBossDto: GetBossDto) {
    return new GranasBoss(await this.bossService.findBoss(getBossDto));
  } // there's no difference between Granas and other servers

  @Roles(RolesTypes.User, RolesTypes.Admin)
  @Get('getAll/:email/:server/')
  async findAllBossesByUser(
    @Param('email') email: string,
    @Param('server') server: Servers,
  ) {
    return await this.bossService.findAllBossesByUser(email, server);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @Put('/updateBoss/:bossName/:server/')
  async updateBoss(
    @Body() updateBossDto: UpdateBossDto,
    @Param('bossName') bossName: BossTypes,
    @Param('server') server: Servers,
  ) {
    try {
      return await this.bossService.updateBoss(server, bossName, updateBossDto);
    } catch (error) {
      throw new HttpException('Boss not updated', HttpStatus.BAD_REQUEST);
    }
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @Put('/updateDeathOfBoss')
  async updateDeathOfBoss(
   @Req() request: Request, @Body() updateBossDeathDto: UpdateBossDeathDto
  ) {

    try {
      return await this.bossService.updateDeathOfBoss(request, updateBossDeathDto);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Resurrect Time not updated',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/crashServer/:server')
  async crashServer(@Req() request: Request, @Param('server') server: Servers) {
    return this.bossService.crashBossServer(request, server);
  }

  @Roles(RolesTypes.User, RolesTypes.Admin)
  @Delete(':bossName/:server')
  async deleteOne(
    @Param('bossName') bossName: BossTypes,
    @Param('server') server: Servers,
  ) {
    return await this.bossService.deleteBoss(server, bossName);
  }

}
