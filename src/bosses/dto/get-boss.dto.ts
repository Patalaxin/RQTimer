import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { BossTypes, Servers } from '../../schemas/bosses.enum';

export class GetBossDto {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsOptional()
  date?: number
}
