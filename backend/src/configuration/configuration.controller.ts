import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokensGuard } from '../guards/tokens.guard';

@ApiBearerAuth()
@ApiTags('Configuration API')
@UseGuards(TokensGuard)
@Controller('configuration')
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

  @Get('locations')
  getLocations() {
    return this.configurationService.getLocations();
  }
}
