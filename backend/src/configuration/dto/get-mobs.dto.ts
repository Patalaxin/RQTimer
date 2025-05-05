import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  bossesArray: BossDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MobDto)
  elitesArray: MobDto[];
}
