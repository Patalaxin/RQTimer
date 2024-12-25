import { Controller, Get } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Configuration API')
@Controller('configurations')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get('servers')
  getServers() {
    return this.configurationService.getServers();
  }

  @Get('mobs')
  getMobs() {
    return this.configurationService.getMobs();
  }

  @Get('mobs-locations')
  getMobsLocations() {
    return this.configurationService.getMobsLocations();
  }
}
