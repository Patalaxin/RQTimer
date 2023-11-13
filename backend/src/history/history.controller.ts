import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { UsersGuard } from '../guards/users.guard';
import { Roles } from '../decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Servers } from '../schemas/mobs.enum';
import { GetHistoryDtoResponse } from './dto/get-history.dto';

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
  ): Promise<GetHistoryDtoResponse[]> {
    return await this.historyService.getAllHistory(server);
  }
}
