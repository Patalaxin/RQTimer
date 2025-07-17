import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMobDateOfRespawnDtoRequest {
  @IsNumber()
  @IsNotEmpty()
  dateOfRespawn: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  comment: string;
}
