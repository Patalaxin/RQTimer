import { IsEnum } from 'class-validator';
import { Locations, MobName, Servers } from '../../schemas/mobs.enum';

export class RespawnLostDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(Servers)
  server: Servers;

  @IsEnum(Locations)
  location: Locations;
}
