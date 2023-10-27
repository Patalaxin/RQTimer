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
import { Roles } from '../decorators/roles.decorator';
import { GetEmailFromToken } from '../decorators/getEmail.decorator';
import { ElitesService } from './elites.service';
import { UsersGuard } from '../guards/users.guard';
import {
  CreateEliteDtoRequest,
  CreateEliteDtoResponse,
} from './dto/create-elite.dto';
import { GetEliteDtoRequest, GetEliteDtoResponse } from './dto/get-elite.dto';
import {
  UpdateEliteDtoBodyRequest,
  UpdateEliteDtoBodyResponse,
  UpdateEliteDtoParamsRequest,
} from './dto/update-elite.dto';
import {
  GetElitesDtoRequest,
  GetElitesDtoResponse,
} from './dto/get-elites.dto';
import { DeleteEliteDtoResponse } from './dto/delete-elite.dto';
import {
  UpdateEliteDeathDtoRequest,
  UpdateEliteDeathDtoResponse,
} from './dto/update-elite-death.dto';
import { RolesTypes } from '../schemas/user.schema';
import { GranasElite } from '../schemas/granasElites.schema';
import { EliteTypes, Servers } from '../schemas/bosses.enum';

@ApiTags('Elite API')
@ApiBearerAuth()
@UseGuards(UsersGuard)
@Controller('elite')
export class ElitesController {
  constructor(private eliteService: ElitesService) {}

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create Elite' })
  @Post('/create')
  async create(
    @Body() createEliteDto: CreateEliteDtoRequest,
  ): Promise<CreateEliteDtoResponse> {
    return new GranasElite(await this.eliteService.createElite(createEliteDto));
  }

  @Roles()
  @ApiOperation({ summary: 'Find Elite' })
  @Get('/findElite/:eliteName/:server/')
  async getOneElite(
    @Param() getEliteDto: GetEliteDtoRequest,
  ): Promise<GetEliteDtoResponse> {
    return await this.eliteService.findElite(getEliteDto);
  }

  @Roles()
  @ApiOperation({ summary: 'Find All User Elites' })
  @Get('/findAll/:server/')
  async findAllEliteByUser(
    @GetEmailFromToken() email: string,
    @Param() getElitesDtoRequest: GetElitesDtoRequest,
  ): Promise<GetElitesDtoResponse[]> {
    return await this.eliteService.findAllEliteByUser(
      email,
      getElitesDtoRequest,
    );
  }

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Elite' })
  @Put('/updateElite/:eliteName/:server/')
  async updateElite(
    @Body() updateEliteDto: UpdateEliteDtoBodyRequest,
    @Param() updateEliteDtoParamsRequest: UpdateEliteDtoParamsRequest,
  ): Promise<UpdateEliteDtoBodyResponse> {
    try {
      return await this.eliteService.updateElite(
        updateEliteDtoParamsRequest,
        updateEliteDto,
      );
    } catch (error) {
      throw new HttpException('Elite not updated', HttpStatus.BAD_REQUEST);
    }
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Update Elite Respawn Time' })
  @Put('/updateDeathOfElite')
  async updateDeathOfElite(
    @Req() request: Request,
    @Body() updateEliteDeathDto: UpdateEliteDeathDtoRequest,
  ): Promise<UpdateEliteDeathDtoResponse> {
    return await this.eliteService.updateDeathOfElite(
      request,
      updateEliteDeathDto,
    );
  }

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Delete Elite' })
  @Delete(':eliteName/:server')
  async deleteOne(
    @Param('eliteName') eliteName: EliteTypes,
    @Param('server') server: Servers,
  ): Promise<DeleteEliteDtoResponse> {
    return await this.eliteService.deleteElite(server, eliteName);
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Crash Elite Server' })
  @Post('/crashServer/:server')
  async crashServer(
    @Req() request: Request,
    @Param('server') server: Servers,
  ): Promise<GetElitesDtoResponse[]> {
    return this.eliteService.crashEliteServer(request, server);
  }
}
