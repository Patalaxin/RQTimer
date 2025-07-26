import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Mob } from '../../schemas/mob.schema';

class MobDto {
  @IsString()
  @IsNotEmpty()
  mobName: string;

  @IsString()
  @IsNotEmpty()
  shortName: string;

  @IsString()
  @IsNotEmpty()
  mobType: string;

  @IsString()
  @IsNotEmpty()
  image: string;
}

class BossDto extends MobDto {
  @IsString()
  @IsNotEmpty()
  respawnText: string;
}

export class GetMobsDtoResponse {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BossDto)
  bossesArray: Mob[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MobDto)
  elitesArray: Mob[];
}
