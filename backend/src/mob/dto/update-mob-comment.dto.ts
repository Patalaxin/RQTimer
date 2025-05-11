import { IsString, IsEnum, MaxLength } from 'class-validator';
import { Servers } from '../../schemas/mobs.enum';

export class UpdateMobCommentDtoBodyRequest {
  @IsString()
  @MaxLength(50)
  comment: string;
}

export class UpdateMobCommentDtoParamsRequest {
  @IsString()
  mobId: string;

  @IsEnum(Servers)
  server: Servers;
}
