import { IsEnum, IsNotEmpty } from 'class-validator';
import { Servers } from '../../schemas/mobs.enum';

export class GetBossesDtoRequest {
  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}
