import { IsEnum, IsNotEmpty } from "class-validator";
import { BossTypes, Servers } from '../../schemas/bosses.enum';

export class GetBossDto {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}
