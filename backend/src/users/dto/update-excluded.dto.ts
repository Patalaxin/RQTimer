import { IsArray, IsEnum, ArrayUnique } from 'class-validator';
import { MobName } from '../../schemas/mobs.enum';

export class UpdateExcludedDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(MobName, { each: true })
  excludedMobs: MobName[];
}
