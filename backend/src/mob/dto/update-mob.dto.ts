import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import {
  Locations,
  MobName,
  MobsTypes,
  ShortMobName,
} from '../../schemas/mobs.enum';

export class UpdateMobDtoBodyRequest {
  @IsEnum(MobName)
  @IsOptional()
  mobName: MobName;

  @IsEnum(ShortMobName)
  @IsOptional()
  shortName: ShortMobName;

  @IsEnum(Locations)
  @IsOptional()
  location: Locations;

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
  @IsMongoId()
  mobId: string;
}
