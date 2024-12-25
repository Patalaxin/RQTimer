import { IsString, IsEnum, MaxLength } from 'class-validator';
import { MobsLocations, MobName, Servers } from '../../schemas/mobs.enum';

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

  @IsEnum(MobsLocations)
  location: MobsLocations;
}
