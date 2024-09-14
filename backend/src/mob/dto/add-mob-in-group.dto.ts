import { IsEnum, IsNotEmpty } from 'class-validator';
import { Locations, Servers, MobName } from '../../schemas/mobs.enum';

export class AddMobInGroupDtoRequest {
  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsEnum(Locations)
  @IsNotEmpty()
  location: Locations;

  @IsEnum(MobName)
  @IsNotEmpty()
  mobName: MobName;
}
