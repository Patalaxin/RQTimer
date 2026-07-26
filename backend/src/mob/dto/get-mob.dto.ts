import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Servers } from '../../schemas/mobs.enum';
import { ApiProperty } from '@nestjs/swagger';
import { MobDto, MobsDataDto } from './mob.dto';

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
  @ApiProperty({ type: MobDto })
  mob: MobDto;
}

export class GetFullMobDtoResponse {
  @ApiProperty({ type: MobDto })
  mob: MobDto;

  @ApiProperty({ type: MobsDataDto, nullable: true })
  mobData: MobsDataDto;
}

export class GetFullMobWithUnixDtoResponse {
  @ApiProperty({ type: MobDto })
  mob: MobDto;

  @ApiProperty({ type: MobsDataDto, nullable: true })
  mobData: MobsDataDto;

  @ApiProperty({ description: 'Unix time at the time of response generation' })
  unixtime: number;
}
