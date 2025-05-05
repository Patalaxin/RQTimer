import { Injectable } from '@nestjs/common';
import { Locations, Servers } from '../schemas/mobs.enum';
import { bossesArray, elitesArray } from './config-mob';
import { GetMobsDtoResponse } from './dto/get-mobs.dto';

@Injectable()
export class ConfigurationService {
  getServers(): Servers[] {
    return Object.values(Servers);
  }

  getMobs(): GetMobsDtoResponse {
    return { bossesArray, elitesArray };
  }

  getLocations(): Locations[] {
    return Object.values(Locations);
  }
}
