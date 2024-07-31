import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import {
  Locations,
  MobName,
  MobsTypes,
  Servers,
  ShortMobName,
} from '../schemas/mobs.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokensGuard } from '../guards/tokens.guard';

@ApiBearerAuth()
@ApiTags('Configuration API')
@UseGuards(TokensGuard)
@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get('servers')
  getServers(): typeof Servers {
    return this.configurationService.getServers();
  }

  @Get('mobs')
  getMobs(): {
    MobsTypes: typeof MobsTypes;
    MobName: typeof MobName;
    ShortMobName: typeof ShortMobName;
  } {
    return this.configurationService.getMobs();
  }

  @Get('locations')
  getLocations(): typeof Locations {
    return this.configurationService.getLocations();
  }
}
