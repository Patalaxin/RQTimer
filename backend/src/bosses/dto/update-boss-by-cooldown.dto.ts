import { IsEnum, IsNotEmpty } from 'class-validator';
import { BossTypes, Servers } from '../../schemas/mobs.enum';

export class UpdateBossByCooldownDtoRequest {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}
