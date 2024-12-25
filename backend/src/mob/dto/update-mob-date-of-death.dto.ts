import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MobsLocations, MobName, Servers } from '../../schemas/mobs.enum';

export class UpdateMobDateOfDeathDtoRequest {
  @IsEnum(MobName)
  @IsNotEmpty()
  mobName: MobName;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsEnum(MobsLocations)
  @IsNotEmpty()
  location: MobsLocations;

  @IsNumber()
  @IsNotEmpty()
  dateOfDeath: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  comment: string;
}
