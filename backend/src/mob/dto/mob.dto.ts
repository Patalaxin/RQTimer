import { ApiProperty } from '@nestjs/swagger';
import {
  Locations,
  MobName,
  MobsTypes,
  Servers,
  ShortMobName,
} from '../../schemas/mobs.enum';

/**
 * Моб из справочника в том виде, в каком его ждёт фронт. Идентификатор
 * называется `_id`, а не `id`: под этим именем он уехал в Mongo, на него же
 * ключуется таблица переводов.
 */
export class MobDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ enum: MobName })
  mobName: MobName;

  @ApiProperty({ enum: ShortMobName })
  shortName: ShortMobName;

  @ApiProperty({ nullable: true })
  respawnText: string | null;

  @ApiProperty({ enum: Locations })
  location: Locations;

  @ApiProperty()
  cooldownTime: number;

  @ApiProperty({ nullable: true })
  image: string | null;

  @ApiProperty({ enum: MobsTypes })
  mobType: MobsTypes;
}

export class MobsDataDto {
  @ApiProperty()
  mobId: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty({ enum: Servers })
  server: Servers;

  @ApiProperty({ nullable: true, description: 'Unix time в миллисекундах' })
  respawnTime: number | null;

  @ApiProperty({ nullable: true, description: 'Unix time в миллисекундах' })
  deathTime: number | null;

  @ApiProperty({ description: 'Сколько раз прибавляли кулдаун моба' })
  cooldown: number;

  @ApiProperty({ nullable: true })
  comment: string | null;

  @ApiProperty()
  respawnLost: boolean;

  @ApiProperty({ enum: MobsTypes })
  mobTypeAdditionalTime: MobsTypes;
}
