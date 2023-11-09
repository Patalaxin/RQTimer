import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { BossTypes, Servers } from '../../schemas/mobs.enum';

export class UpdateBossDateOfDeathDtoRequest {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsNotEmpty()
  dateOfDeath: number | null;
}
