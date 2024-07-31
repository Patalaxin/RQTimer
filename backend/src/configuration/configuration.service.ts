import { Injectable } from '@nestjs/common';
import { bosses, elites, Locations, Servers } from '../schemas/mobs.enum';

@Injectable()
export class ConfigurationService {
  getServers(): string[] {
    return Object.values(Servers);
  }

  getMobs(): {
    bosses: Record<string, string>;
    elites: Record<string, string>;
  } {
    return { bosses, elites };
  }

  getLocations(): string[] {
    return Object.values(Locations);
  }
}
