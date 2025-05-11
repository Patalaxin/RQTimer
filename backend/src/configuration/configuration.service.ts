import { Injectable } from '@nestjs/common';
import { Locations, Servers } from '../schemas/mobs.enum';
import { GetMobsDtoResponse } from './dto/get-mobs.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Mob, MobDocument } from '../schemas/mob.schema';
import { Model } from 'mongoose';
import { translateMob } from '../utils/translate-mob';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectModel(Mob.name)
    private mobModel: Model<MobDocument>,
  ) {}

  getServers(): Servers[] {
    return Object.values(Servers);
  }

  async getMobs(lang: string): Promise<GetMobsDtoResponse> {
    const allMobs = await this.mobModel
      .find({ mobType: { $in: ['Босс', 'Элитка'] } })
      .select('mobName shortName mobType image respawnText location _id')
      .lean();

    const bossesArray: Mob[] = allMobs
      .filter((mob) => mob.mobType === 'Босс')
      .map((mob) => translateMob(mob, lang));

    const elitesArray: Mob[] = allMobs
      .filter((mob) => mob.mobType === 'Элитка')
      .map((mob) => translateMob(mob, lang));

    return { bossesArray, elitesArray };
  }

  getLocations(): Locations[] {
    return Object.values(Locations);
  }
}
