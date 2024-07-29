import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { HistoryService } from './history.service';
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
import { MobName, Servers } from '../schemas/mobs.enum';
import { PaginatedHistoryDto } from './dto/get-history.dto';
import { RolesTypes } from '../schemas/user.schema';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';

@ApiBearerAuth()
@ApiTags('History API')
@UseGuards(TokensGuard)
@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get All History' })
  @ApiParam({ name: 'server', enum: Servers })
  @ApiQuery({ name: 'mobName', enum: MobName, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched history',
    type: PaginatedHistoryDto,
  })
  @Get('/findAll/:server')
  async findAll(
    @Param('server') server: Servers,
    @Query('mobName') mobName?: MobName,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedHistoryDto> {
    return await this.historyService.getAllHistory(
      server,
      mobName,
      page,
      limit,
    );
  }

  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Delete All History by Server' })
  @ApiParam({ name: 'server', enum: Servers })
  @ApiOkResponse({ description: 'Success', type: DeleteAllHistoryDtoResponse })
  @Delete('/deleteAll')
  deleteAll(
    @Param('server') server: Servers,
  ): Promise<DeleteAllHistoryDtoResponse> {
    return this.historyService.deleteAll(server);
  }
}
