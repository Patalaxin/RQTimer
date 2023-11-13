import {
  IsArray,
  IsEnum,
  ArrayUnique,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';
import { MobName } from '../../schemas/mobs.enum';

export class UpdateUnavailableDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(MobName, { each: true })
  unavailableMobs: MobName[];

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
