import { IsEnum, IsInt, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ChestsTypes } from '../../schemas/chest.enum';

export class ChestTypeRequestDto {
  @IsEnum(ChestsTypes)
  type: ChestsTypes;

  @IsInt()
  @Min(1)
  count: number;
}

export class AddChestBodyRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChestTypeRequestDto)
  chests: ChestTypeRequestDto[];
}
