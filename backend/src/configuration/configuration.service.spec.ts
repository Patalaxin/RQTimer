import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationService } from './configuration.service';
import { PrismaService } from '../prisma/prisma.service';
import { Locations, MobsTypes, Servers } from '../schemas/mobs.enum';

// Настоящий id Архона из справочника — на него завязана таблица переводов.
const ARCHON_ID = '673148021e738aba75ba3402';

describe('ConfigurationService (smoke)', () => {
  let service: ConfigurationService;
  let prisma: { mob: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { mob: { findMany: jest.fn().mockResolvedValue([]) } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ConfigurationService);
  });

  it('serves servers and locations straight from the enums', () => {
    expect(service.getServers()).toEqual(Object.values(Servers));
    expect(service.getLocations()).toEqual(Object.values(Locations));
  });

  describe('getMobs', () => {
    const rows = [
      {
        id: ARCHON_ID,
        mobName: 'Архон',
        shortName: 'Арх',
        mobType: MobsTypes.Босс,
        image: 'arch.avif',
        respawnText: 'В месте мрачном и пустынном...',
        location: Locations.Междуречье,
      },
      {
        id: 'elite-1',
        mobName: 'Альфа Самец',
        shortName: 'Альфа',
        mobType: MobsTypes.Элитка,
        image: 'alpha.avif',
        respawnText: null,
        location: Locations.Тадано,
      },
    ];

    it('splits bosses and elites and exposes the catalog id as _id', async () => {
      prisma.mob.findMany.mockResolvedValue(rows);

      const { bossesArray, elitesArray } = await service.getMobs('ru');

      expect(bossesArray).toHaveLength(1);
      expect(elitesArray).toHaveLength(1);
      // Фронт и mobs-translations знают моба по _id, а не по присмовскому id.
      expect(bossesArray[0]._id).toBe(ARCHON_ID);
      expect(bossesArray[0]).not.toHaveProperty('id');
      expect(bossesArray[0].mobName).toBe('Архон');

      const { where } = prisma.mob.findMany.mock.calls[0][0];
      expect(where.mobType.in).toEqual([MobsTypes.Босс, MobsTypes.Элитка]);
    });

    it('translates by catalog id when a non-ru language is asked for', async () => {
      prisma.mob.findMany.mockResolvedValue(rows);

      const { bossesArray } = await service.getMobs('en');

      expect(bossesArray[0]._id).toBe(ARCHON_ID);
      expect(bossesArray[0].mobName).toBe('Archon');
      expect(bossesArray[0].location).toBe('Interfluve');
    });

    it('keeps the original values when the mob has no translation', async () => {
      prisma.mob.findMany.mockResolvedValue(rows);

      const { elitesArray } = await service.getMobs('en');

      expect(elitesArray[0].mobName).toBe('Альфа Самец');
    });
  });
});
