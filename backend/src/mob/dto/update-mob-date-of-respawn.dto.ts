import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { Locations, MobName, Servers } from '../../schemas/mobs.enum';

export class UpdateMobDateOfRespawnDtoRequest {
  @IsEnum(MobName)
  @IsNotEmpty()
  mobName: MobName;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsEnum(Locations)
  @IsNotEmpty()
  location: Locations;

  @IsNumber()
  @IsNotEmpty()
  dateOfRespawn: number | null;
}
