import { Controller, Get } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Locations, Servers } from '../schemas/mobs.enum';
import { GetMobsDtoResponse } from './dto/get-mobs.dto';

@ApiTags('Configuration API')
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
  @Get('servers')
  getServers(): Servers[] {
    return this.configurationService.getServers();
  }

  @Get('mobs')
  getMobs(): GetMobsDtoResponse {
    return this.configurationService.getMobs();
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
  @Get('locations')
  getLocations(): Locations[] {
    return this.configurationService.getLocations();
  }
}
