import { IsEnum } from "class-validator";
import { Locations, MobName, Servers } from "../../schemas/mobs.enum";

export class RespawnLostDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(Locations)
  location: Locations;

  @IsEnum(Servers)
  server: Servers;
}