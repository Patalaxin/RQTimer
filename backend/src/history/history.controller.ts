import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  Query,
  Inject,
} from '@nestjs/common';
import { TokensGuard } from '../guards/tokens.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Servers } from '../schemas/mobs.enum';
import { PaginatedHistoryDto } from './dto/get-history.dto';
import { RolesTypes } from '../schemas/user.schema';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';
import { GetGroupNameFromToken } from '../decorators/getGroupName.decorator';
import { IHistory } from './history.interface';
import { HistoryTypes } from './history-types.interface';

@ApiBearerAuth()
@ApiTags('History API')
@UseGuards(TokensGuard)
@Controller('history')
export class HistoryController {
  constructor(
    @Inject('IHistory') private readonly historyInterface: IHistory,
  ) {}

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get All History' })
  @ApiParam({ name: 'server', enum: Servers })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'historyType', required: false, enum: HistoryTypes })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched history',
    type: PaginatedHistoryDto,
  })
  @Get('/list/:server')
  async findAll(
    @Param('server') server: Servers,
    @GetGroupNameFromToken() groupName: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('lang') language = 'ru',
    @Query('historyType') historyType?: HistoryTypes,
  ): Promise<PaginatedHistoryDto> {
    return await this.historyInterface.getAllHistory(
      server,
      groupName,
      page,
      limit,
      language,
      historyType,
    );
  }

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get Mob History' })
  @ApiParam({ name: 'server', enum: Servers })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched history',
    type: PaginatedHistoryDto,
  })
  @Get('/:server/:mobId')
  async findByMob(
    @Param('server') server: Servers,
    @GetGroupNameFromToken() groupName: string,
    @Param('mobId') mobId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('lang') language = 'ru',
  ): Promise<PaginatedHistoryDto> {
    return await this.historyInterface.getMobHistory(
      server,
      groupName,
      mobId,
      page,
      limit,
      language,
    );
  }

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Delete All History by Server' })
  @ApiParam({ name: 'server', enum: Servers })
  @ApiOkResponse({ description: 'Success', type: DeleteAllHistoryDtoResponse })
  @Delete(':server')
  deleteAll(
    @Param('server') server: Servers,
    @GetGroupNameFromToken() groupName: string,
  ): Promise<DeleteAllHistoryDtoResponse> {
    return this.historyInterface.deleteAll(server, groupName);
  }
}
