import { Injectable } from '@nestjs/common';
import { Locations, MobsTypes, Servers } from '../schemas/mobs.enum';
import {
  BossCatalogItemDto,
  GetMobsDtoResponse,
  MobCatalogItemDto,
} from './dto/get-mobs.dto';
import { translateMob } from '../utils/translate-mob';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  getServers(): Servers[] {
    return Object.values(Servers);
  }

  async getMobs(lang: string): Promise<GetMobsDtoResponse> {
    const allMobs = await this.prisma.mob.findMany({
      where: { mobType: { in: [MobsTypes.Босс, MobsTypes.Элитка] } },
      select: {
        id: true,
        mobName: true,
        shortName: true,
        mobType: true,
        image: true,
        respawnText: true,
        location: true,
      },
    });

    // Фронт и таблица переводов знают моба по `_id`, поэтому наружу отдаём
    // именно это имя поля, а не присмовское `id`.
    const catalog: BossCatalogItemDto[] = allMobs.map(({ id, ...mob }) => ({
      _id: id,
      ...mob,
    }));

    const bossesArray = catalog
      .filter((mob) => mob.mobType === MobsTypes.Босс)
      .map((mob) => translateMob(mob, lang));

    const elitesArray: MobCatalogItemDto[] = catalog
      .filter((mob) => mob.mobType === MobsTypes.Элитка)
      .map((mob) => translateMob(mob, lang));

    return { bossesArray, elitesArray };
  }

  getLocations(): Locations[] {
    return Object.values(Locations);
  }
}
