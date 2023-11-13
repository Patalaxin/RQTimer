import { IsEnum, IsNotEmpty } from 'class-validator';
import { Locations, Servers, MobName } from '../../schemas/mobs.enum';
import { Expose, Type } from 'class-transformer';
import { Mob } from '../../schemas/mob.schema';
import { MobsData } from '../../schemas/mobsData.schema';

export class GetMobDtoRequest {
  @IsEnum(MobName)
  @IsNotEmpty()
  mobName: MobName;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsEnum(Locations)
  @IsNotEmpty()
  location: Locations;
}

export class GetFullMobDtoResponse {
  @Expose()
  @Type(() => Mob)
  mob: Mob;

  @Expose()
  @Type(() => MobsData)
  mobData: MobsData;
}

export class GetMobDtoResponse {
  @Expose()
  @Type(() => Mob)
  mob: Mob;
}

export class GetMobDataDtoResponse {
  @Expose()
  @Type(() => MobsData)
  mobData: MobsData;
}
