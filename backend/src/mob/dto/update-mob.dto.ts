import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import {
  MobsLocations,
  MobName,
  MobsTypes,
  Servers,
  ShortMobName,
} from '../../schemas/mobs.enum';

export class UpdateMobDtoBodyRequest {
  @IsEnum(MobName)
  @IsOptional()
  mobName: MobName;

  @IsEnum(ShortMobName)
  @IsOptional()
  shortName: ShortMobName;

  @IsEnum(MobsLocations)
  @IsOptional()
  location: MobsLocations;

  @IsString()
  @IsOptional()
  respawnText: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsNumber()
  @IsOptional()
  cooldownTime: number;

  @IsEnum(MobsTypes)
  @IsOptional()
  mobType: MobsTypes;
}

export class UpdateMobDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(Servers)
  server: Servers;

  @IsEnum(MobsLocations)
  location: MobsLocations;
}
