import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Servers } from '../../schemas/mobs.enum';
import { Expose, Type } from 'class-transformer';
import { Mob } from '../../schemas/mob.schema';
import { MobsData } from '../../schemas/mobsData.schema';
import { ApiProperty } from '@nestjs/swagger';

export class GetMobInGroupDtoRequest {
  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsString()
  @IsNotEmpty()
  mobId: string;
}

export class GetMobDtoRequest {
  @IsString()
  @IsNotEmpty()
  mobId: string;
}

export class GetMobDtoResponse {
  @ApiProperty()
  @Expose()
  @Type(() => Mob)
  mob: Mob;
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
