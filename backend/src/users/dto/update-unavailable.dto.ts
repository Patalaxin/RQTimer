import {
  IsArray,
  IsEnum,
  ArrayUnique,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';
import { BossTypes, EliteTypes } from '../../schemas/mobs.enum';

export class UpdateUnavailableDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(BossTypes, { each: true })
  unavailableBosses: BossTypes[];

  @IsArray()
  @ArrayUnique()
  @IsEnum(EliteTypes, { each: true })
  unavailableElites: EliteTypes[];

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
