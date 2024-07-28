import {
  IsArray,
  IsEnum,
  ArrayUnique,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MobName } from '../../schemas/mobs.enum';

export class UpdateUnavailableDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(MobName, { each: true })
  unavailableMobs: MobName[];

  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nickname?: string;
}
