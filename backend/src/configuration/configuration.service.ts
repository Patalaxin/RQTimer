import { Injectable } from '@nestjs/common';
import {
  Locations,
  MobName,
  MobsTypes,
  Servers,
  ShortMobName,
} from '../schemas/mobs.enum';

@Injectable()
export class ConfigurationService {
  getServers(): typeof Servers {
    return Servers;
  }

  getMobs(): {
    MobsTypes: typeof MobsTypes;
    MobName: typeof MobName;
    ShortMobName: typeof ShortMobName;
  } {
    return { MobsTypes, MobName, ShortMobName };
  }

  getLocations(): typeof Locations {
    return Locations;
  }
}
