import { Injectable } from '@nestjs/common';
import { Locations, Servers } from '../schemas/mobs.enum';
import { bossesArray, elitesArray } from './config-mob';

@Injectable()
export class ConfigurationService {
  getServers(): string[] {
    return Object.values(Servers);
  }

  getMobs() {
    return { bossesArray, elitesArray };
  }

  getLocations(): string[] {
    return Object.values(Locations);
  }
}
