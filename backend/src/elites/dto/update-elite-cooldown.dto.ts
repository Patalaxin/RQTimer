import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { EliteTypes, Servers } from '../../schemas/mobs.enum';

export class UpdateEliteCooldownDtoRequest {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  cooldown: number;
}
