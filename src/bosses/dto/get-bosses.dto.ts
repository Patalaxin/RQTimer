import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BossTypes, Locations, MobsTypes, Servers, ShortBossName } from "../../schemas/mobs.enum";

export class GetBossesDtoRequest {
  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}

export class GetBossesDtoResponse {
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
  willResurrect: number;

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
}
