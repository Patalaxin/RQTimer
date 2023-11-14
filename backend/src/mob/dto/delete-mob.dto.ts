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

export class DeleteMobDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(Locations)
  location: Locations;

  @IsEnum(Servers)
  server: Servers;
}
