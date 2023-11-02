import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf
} from "class-validator";
import { BossTypes, Locations, MobsTypes, Servers, ShortBossName } from "../../schemas/mobs.enum";

export class UpdateBossDeathDtoRequest {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsOptional()
  @ValidateIf((object) => !object.dateOfRespawn || object.dateOfDeath)
  dateOfDeath?: number;

  @IsNumber()
  @IsOptional()
  @ValidateIf((object) => !object.dateOfDeath || object.dateOfRespawn)
  dateOfRespawn?: number;
}

export class UpdateBossDeathDtoResponse {
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
