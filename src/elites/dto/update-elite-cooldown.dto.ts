import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional, IsPositive,
  IsString,
} from "class-validator";
import { EliteTypes, Locations, MobsTypes, Servers } from "../../schemas/mobs.enum";

export class UpdateEliteCooldownDtoRequest {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  cooldown: number;
}

export class UpdateEliteCooldownDtoResponse {
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
