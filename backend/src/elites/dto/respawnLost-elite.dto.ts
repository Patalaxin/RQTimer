import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from "class-validator";
import { EliteTypes, Locations, MobsTypes, ShortEliteName } from "../../schemas/mobs.enum";

export class RespawnLostEliteDtoResponse {
  @IsEnum(EliteTypes)
  @IsOptional()
  eliteName: EliteTypes;

  @IsEnum(ShortEliteName)
  @IsNotEmpty()
  shortName: ShortEliteName;

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
