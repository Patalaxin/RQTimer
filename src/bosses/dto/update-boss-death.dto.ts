import { IsEnum, IsNotEmpty, IsNumber, IsOptional, ValidateIf } from "class-validator";
import { BossTypes, Servers } from '../../schemas/bosses.enum';

export class UpdateBossDeathDto {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsOptional()
  @ValidateIf((object) => !object.dateOfRespawn || object.dateOfDeath)
  dateOfDeath?: number

  @IsNumber()
  @IsOptional()
  @ValidateIf((object) => !object.dateOfDeath || object.dateOfRespawn)
  dateOfRespawn?: number
}
