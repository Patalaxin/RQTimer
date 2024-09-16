import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Locations, MobName, Servers } from '../../schemas/mobs.enum';

export class DeleteMobDtoResponse {
  @ApiProperty({
    example: 'Mob deleted',
  })
  @IsString()
  message: string;
}

export class DeleteMobFromGroupDtoResponse {
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

  @IsEnum(Locations)
  location: Locations;
}

export class DeleteMobFromGroupDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(Servers)
  server: Servers;

  @IsEnum(Locations)
  location: Locations;
}
