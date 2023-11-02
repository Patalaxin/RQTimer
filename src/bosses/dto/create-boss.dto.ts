import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum, IsBoolean
} from "class-validator";
import { BossTypes, Locations, MobsTypes, Servers, ShortBossName } from "../../schemas/mobs.enum";

export class CreateBossDtoRequest {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(ShortBossName)
  @IsNotEmpty()
  shortName: ShortBossName;

  @IsString()
  @IsOptional()
  respawnText: string;

  @IsEnum(Locations)
  @IsNotEmpty()
  location: Locations;

  @IsNumber()
  @IsNotEmpty()
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

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsEnum(MobsTypes)
  @IsNotEmpty()
  mobType: MobsTypes;

  @IsBoolean()
  @IsNotEmpty()
  respawnLost: boolean;
}

export class CreateBossDtoResponse {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(BossTypes)
  @IsNotEmpty()
  shortName: ShortBossName;

  @IsString()
  @IsOptional()
  respawnText: string;

  @IsEnum(Locations)
  @IsNotEmpty()
  location: Locations;

  @IsNumber()
  @IsNotEmpty()
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

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsEnum(MobsTypes)
  @IsNotEmpty()
  mobType: MobsTypes;

  @IsBoolean()
  @IsNotEmpty()
  respawnLost: boolean;
}
