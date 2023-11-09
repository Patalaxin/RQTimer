import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { BossTypes, Servers } from '../../schemas/mobs.enum';

export class UpdateBossDateOfRespawnDtoRequest {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsNotEmpty()
  dateOfRespawn: number | null;
}
