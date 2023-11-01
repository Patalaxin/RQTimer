import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional, IsPositive,
  IsString,
} from "class-validator";
import { BossTypes, Locations, MobsTypes, Servers } from "../../schemas/mobs.enum";

export class UpdateBossCooldownDtoRequest {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  cooldown: number;
}

export class UpdateBossCooldownDtoResponse {
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

  @IsEnum(MobsTypes)
  @IsNotEmpty()
  mobType: MobsTypes;
}
