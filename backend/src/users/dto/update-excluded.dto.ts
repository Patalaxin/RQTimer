import { IsArray, IsEnum, ArrayUnique } from 'class-validator';
import { BossTypes, EliteTypes } from '../../schemas/mobs.enum';

export class UpdateExcludedDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(BossTypes, { each: true })
  excludedBosses: BossTypes[];

  @IsArray()
  @ArrayUnique()
  @IsEnum(EliteTypes, { each: true })
  excludedElites: EliteTypes[];
}
