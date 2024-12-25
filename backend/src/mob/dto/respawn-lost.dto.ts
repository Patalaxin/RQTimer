import { IsEnum } from 'class-validator';
import { MobsLocations, MobName, Servers } from '../../schemas/mobs.enum';

export class RespawnLostDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(Servers)
  server: Servers;

  @IsEnum(MobsLocations)
  location: MobsLocations;
}
