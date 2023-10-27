import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { BossTypes, Locations, Servers } from '../../schemas/mobs.enum';

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
}
