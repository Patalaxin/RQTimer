import { IsEnum, IsNotEmpty } from 'class-validator';
import { EliteTypes, Servers } from '../../schemas/mobs.enum';

export class UpdateEliteByCooldownDtoRequest {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}
