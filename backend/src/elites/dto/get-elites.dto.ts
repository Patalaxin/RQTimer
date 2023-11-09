import { IsEnum, IsNotEmpty } from 'class-validator';
import { Servers } from '../../schemas/mobs.enum';

export class GetElitesDtoRequest {
  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}
