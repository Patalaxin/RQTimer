import { IsEnum, IsNotEmpty } from 'class-validator';
import { Locations, Servers, MobName } from '../../schemas/mobs.enum';
import { Expose, Type } from 'class-transformer';
import { Mob } from '../../schemas/mob.schema';
import { MobsData } from '../../schemas/mobsData.schema';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty()
  @Expose()
  @Type(() => Mob)
  mob: Mob;

  @ApiProperty()
  @Expose()
  @Type(() => MobsData)
  mobData: MobsData;
}

export class GetFullMobWithUnixDtoResponse {
  @ApiProperty()
  @Expose()
  @Type(() => Mob)
  mob: Mob;

  @ApiProperty()
  @Expose()
  @Type(() => MobsData)
  mobData: MobsData;

  @ApiProperty({ description: 'Unix time at the time of response generation' })
  @Expose()
  unixtime: number;
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
