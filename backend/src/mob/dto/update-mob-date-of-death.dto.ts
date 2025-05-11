import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMobDateOfDeathDtoRequest {
  @IsNumber()
  @IsNotEmpty()
  dateOfDeath: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  comment: string;
}
