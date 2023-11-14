import { IsEnum } from 'class-validator';
import { Servers } from '../../schemas/mobs.enum';

export class CrashServerDtoParamsRequest {
  @IsEnum(Servers)
  server: Servers;
}
