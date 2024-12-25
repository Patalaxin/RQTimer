import { Injectable } from '@nestjs/common';
import { MobsLocations, Servers } from '../schemas/mobs.enum';
import { bossesArray, elitesArray } from './config-mob';

@Injectable()
export class ConfigurationService {
  getServers(): string[] {
    return Object.values(Servers);
  }

  getMobs() {
    return { bossesArray, elitesArray };
  }

  getMobsLocations(): string[] {
    return Object.values(MobsLocations);
  }
}
