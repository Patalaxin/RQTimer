import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum, IsBoolean
} from "class-validator";
import { BossTypes, Locations, MobsTypes, Servers, ShortBossName } from "../../schemas/mobs.enum";

export class UpdateBossDtoBodyRequest {
  @IsEnum(BossTypes)
  @IsOptional()
  bossName: BossTypes;

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

  @IsBoolean()
  @IsNotEmpty()
  respawnLost: boolean;
}

export class UpdateBossDtoParamsRequest {
  @IsEnum(BossTypes)
  @IsOptional()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsOptional()
  server: Servers;
}

export class UpdateBossDtoBodyResponse {
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
