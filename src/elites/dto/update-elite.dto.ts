import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { EliteTypes, Locations, MobsTypes, Servers } from "../../schemas/mobs.enum";

export class UpdateEliteDtoBodyRequest {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

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
  @IsOptional()
  image: string;

  @IsNumber()
  @IsOptional()
  cooldownTime: number;
}

export class UpdateEliteDtoParamsRequest {
  @IsEnum(EliteTypes)
  @IsOptional()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsOptional()
  server: Servers;
}

export class UpdateEliteDtoBodyResponse {
  @IsEnum(EliteTypes)
  @IsOptional()
  eliteName: EliteTypes;

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
