import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Inject,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UnixtimeResponseDto } from './dto/get-unixtime.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokensGuard } from '../guards/tokens.guard';
import { IUnixtime } from './unixtime.interface';

@UseGuards(TokensGuard)
@ApiTags('Unixtime API')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('unixtime')
export class UnixtimeController {
  constructor(
    @Inject('IUnixtime') private readonly unixtimeInterface: IUnixtime,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Unixtime' })
  @Get()
  async getUnixTime(): Promise<UnixtimeResponseDto> {
    return this.unixtimeInterface.getUnixtime();
  }
}
