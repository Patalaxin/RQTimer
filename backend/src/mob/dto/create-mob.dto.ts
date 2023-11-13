import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import {
  Locations,
  MobName,
  MobsTypes,
  Servers,
  ShortMobName,
} from '../../schemas/mobs.enum';

export class CreateMobDtoRequest {
  @IsEnum(MobName)
  @IsNotEmpty()
  mobName: MobName;

  @IsEnum(ShortMobName)
  @IsNotEmpty()
  shortName: ShortMobName;

  @IsEnum(Locations)
  @IsNotEmpty()
  location: Locations;

  @IsString()
  @IsOptional()
  respawnText: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsNumber()
  @IsOptional()
  cooldownTime: number;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsEnum(MobsTypes)
  @IsNotEmpty()
  mobType: MobsTypes;
}
