import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UnixtimeService } from './unixtime.service';
import { UnixtimeResponseDto } from './dto/get-unixtime.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokensGuard } from '../guards/tokens.guard';

@ApiTags('Unixtime API')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('unixtime')
export class UnixtimeController {
  constructor(private readonly unixtimeService: UnixtimeService) {}

  @UseGuards(TokensGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Unixtime' })
  @Get()
  async getUnixTime(): Promise<UnixtimeResponseDto> {
    return this.unixtimeService.getUnixtime();
  }
}
