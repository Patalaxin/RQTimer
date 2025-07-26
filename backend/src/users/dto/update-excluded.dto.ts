import { IsArray, IsMongoId } from 'class-validator';

export class UpdateExcludedDto {
  @IsArray()
  @IsMongoId({ each: true })
  excludedMobs: string[];
}
