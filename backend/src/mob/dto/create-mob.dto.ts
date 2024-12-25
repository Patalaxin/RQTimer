import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MobsLocations, MobName, MobsTypes } from '../../schemas/mobs.enum';

export class CreateMobDtoRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobName: MobName;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shortName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  respawnText?: string;

  @ApiProperty({ enum: MobsLocations })
  @IsEnum(MobsLocations)
  location: MobsLocations;

  @ApiProperty()
  @IsNumber()
  cooldownTime: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ enum: MobsTypes })
  @IsEnum(MobsTypes)
  mobType: MobsTypes;
}
