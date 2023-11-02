import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from "class-validator";
import { EliteTypes, Locations, MobsTypes, Servers, ShortEliteName } from "../../schemas/mobs.enum";

export class GetEliteDtoRequest {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}

export class GetEliteDtoResponse {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(ShortEliteName)
  @IsNotEmpty()
  shortName: ShortEliteName;

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
