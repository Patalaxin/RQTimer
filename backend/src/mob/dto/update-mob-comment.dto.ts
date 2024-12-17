import { IsString, IsEnum, MaxLength } from 'class-validator';
import { Locations, MobName, Servers } from '../../schemas/mobs.enum';

export class UpdateMobCommentDtoBodyRequest {
  @IsString()
  @MaxLength(50)
  comment: string;
}

export class UpdateMobCommentDtoParamsRequest {
  @IsEnum(MobName)
  mobName: MobName;

  @IsEnum(Servers)
  server: Servers;

  @IsEnum(Locations)
  location: Locations;
}
