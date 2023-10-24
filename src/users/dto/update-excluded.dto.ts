import {
  IsArray,
  IsEnum,
  ArrayUnique,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';
import { BossTypes, EliteTypes } from '../../schemas/bosses.enum';

export class UpdateExcludedDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(BossTypes, { each: true })
  excludedBosses: BossTypes[];

  @IsArray()
  @ArrayUnique()
  @IsEnum(EliteTypes, { each: true })
  excludedElites: EliteTypes[];

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
