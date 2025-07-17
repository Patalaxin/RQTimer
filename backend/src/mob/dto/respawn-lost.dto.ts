import { IsEnum, IsString } from 'class-validator';
import { Servers } from '../../schemas/mobs.enum';

export class RespawnLostDtoParamsRequest {
  @IsEnum(Servers)
  server: Servers;

  @IsString()
  mobId: string;
}
