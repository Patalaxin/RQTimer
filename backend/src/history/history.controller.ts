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
import { UsersGuard } from '../guards/users.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MobName, Servers } from '../schemas/mobs.enum';
import { GetHistoryDtoResponse } from './dto/get-history.dto';
import { RolesTypes } from '../schemas/user.schema';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';

@ApiBearerAuth()
@ApiTags('History API')
@UseGuards(UsersGuard)
@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Roles()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get All History' })
  @Get('/findAll/:server')
  async findAll(
    @Param('server') server: Servers,
    @Query('mobName') mobName?: MobName,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{
    data: GetHistoryDtoResponse[];
    total: number;
    page: number;
    pages: number;
  }> {
    return await this.historyService.getAllHistory(
      server,
      mobName,
      page,
      limit,
    );
  }

  @UseGuards(UsersGuard)
  @Roles(RolesTypes.Admin)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Delete All History by Server' })
  @ApiOkResponse({ description: 'Success', type: DeleteAllHistoryDtoResponse })
  @Delete('/deleteAll')
  deleteAll(
    @Param('server') server: Servers,
  ): Promise<DeleteAllHistoryDtoResponse> {
    return this.historyService.deleteAll(server);
  }
}
