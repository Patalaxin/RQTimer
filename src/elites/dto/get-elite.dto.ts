import { IsEnum, IsNotEmpty } from 'class-validator';
import { EliteTypes, Servers } from '../../schemas/bosses.enum';

export class GetEliteDto {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}
