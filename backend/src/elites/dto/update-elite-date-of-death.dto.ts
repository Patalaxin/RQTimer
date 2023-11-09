import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { EliteTypes, Servers } from '../../schemas/mobs.enum';

export class UpdateEliteDateOfDeathDtoRequest {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsNotEmpty()
  dateOfDeath: number | null;
}
