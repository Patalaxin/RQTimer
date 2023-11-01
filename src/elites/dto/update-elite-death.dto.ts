import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { EliteTypes, Locations, MobsTypes, Servers, ShortEliteName } from "../../schemas/mobs.enum";

export class UpdateEliteDeathDtoRequest {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

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

export class UpdateEliteDeathDtoResponse {
  @IsEnum(EliteTypes)
  @IsOptional()
  eliteName: EliteTypes;

  @IsEnum(ShortEliteName)
  @IsNotEmpty()
  shortName: ShortEliteName;

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
}
