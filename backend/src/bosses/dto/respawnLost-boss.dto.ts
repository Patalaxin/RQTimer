import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from "class-validator";
import { BossTypes, Locations, MobsTypes, ShortBossName } from "../../schemas/mobs.enum";

export class RespawnLostBossDtoResponse {
  @IsEnum(BossTypes)
  @IsOptional()
  bossName: BossTypes;

  @IsEnum(ShortBossName)
  @IsNotEmpty()
  shortName: ShortBossName;

  @IsString()
  @IsOptional()
  respawnText: string;

  @IsEnum(Locations)
  @IsOptional()
  location: Locations;

  @IsNumber()
  @IsOptional()
  respawnTime: number;

  @IsNumber()
  @IsOptional()
  deathTime: number;

  @IsNumber()
  @IsOptional()
  cooldown: number;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsNumber()
  @IsOptional()
  cooldownTime: number;

  @IsEnum(MobsTypes)
  @IsNotEmpty()
  mobType: MobsTypes;

  @IsBoolean()
  @IsNotEmpty()
  respawnLost: boolean;
}
