import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { EliteTypes, Servers } from '../../schemas/mobs.enum';

export class UpdateEliteDateOfRespawnDtoRequest {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsNotEmpty()
  dateOfRespawn: number | null;
}
