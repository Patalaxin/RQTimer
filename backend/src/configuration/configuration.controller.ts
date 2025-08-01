import { Controller, Get, Header, Query } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Locations, Servers } from '../schemas/mobs.enum';
import { GetMobsDtoResponse } from './dto/get-mobs.dto';

@ApiTags('Configurations API')
@Controller('configurations')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @ApiResponse({
    status: 200,
    description: 'Список серверов',
    schema: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(Servers),
      },
    },
  })
  @Header('Cache-Control', 'public, max-age=3600')
  @Get('servers')
  getServers(): Servers[] {
    return this.configurationService.getServers();
  }

  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['ru', 'en'],
    description: 'Язык (по умолчанию ru)',
  })
  @ApiResponse({
    status: 200,
    description: 'Список мобов (боссы и элиты)',
    type: GetMobsDtoResponse,
  })
  @Header('Cache-Control', 'public, max-age=3600')
  @Get('mobs')
  getMobs(@Query('lang') lang = 'ru'): Promise<GetMobsDtoResponse> {
    return this.configurationService.getMobs(lang);
  }

  @ApiResponse({
    status: 200,
    description: 'Список локаций',
    schema: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(Locations),
      },
    },
  })
  @Header('Cache-Control', 'public, max-age=3600')
  @Get('locations')
  getLocations(): Locations[] {
    return this.configurationService.getLocations();
  }
}
