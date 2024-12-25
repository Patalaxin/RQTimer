import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MobsLocations, MobName, Servers } from '../../schemas/mobs.enum';

export class DeleteMobDtoResponse {
  @ApiProperty({
    example: 'Mob deleted',
  })
  @IsString()
  message: string;
}

export class RemoveMobFromGroupDtoResponse {
  @ApiProperty({
    example: 'Mob deleted from group',
  })
  @IsString()
  message: string;
}

export class DeleteAllMobsDataDtoResponse {
  @ApiProperty({
    example: 'All Mobs Data deleted',
  })
  @IsString()
  message: string;
}

export class DeleteMobDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(MobsLocations)
  location: MobsLocations;
}

export class RemoveMobFromGroupDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(Servers)
  server: Servers;

  @IsEnum(MobsLocations)
  location: MobsLocations;
}
