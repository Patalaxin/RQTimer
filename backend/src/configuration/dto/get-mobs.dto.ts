import { ApiProperty } from '@nestjs/swagger';
import {
  Locations,
  MobName,
  MobsTypes,
  ShortMobName,
} from '../../schemas/mobs.enum';

export class MobCatalogItemDto {
  @ApiProperty({ description: 'Идентификатор моба в справочнике' })
  _id: string;

  @ApiProperty({ enum: MobName })
  mobName: string;

  @ApiProperty({ enum: ShortMobName })
  shortName: string;

  @ApiProperty({ enum: MobsTypes })
  mobType: string;

  @ApiProperty({ enum: Locations })
  location: string;

  @ApiProperty({ nullable: true })
  image: string | null;
}

export class BossCatalogItemDto extends MobCatalogItemDto {
  @ApiProperty({ nullable: true })
  respawnText: string | null;
}

export class GetMobsDtoResponse {
  @ApiProperty({ type: [BossCatalogItemDto] })
  bossesArray: BossCatalogItemDto[];

  @ApiProperty({ type: [MobCatalogItemDto] })
  elitesArray: MobCatalogItemDto[];
}
