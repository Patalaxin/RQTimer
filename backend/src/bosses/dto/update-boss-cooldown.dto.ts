import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { BossTypes, Servers } from '../../schemas/mobs.enum';

export class UpdateBossCooldownDtoRequest {
  @IsEnum(BossTypes)
  @IsNotEmpty()
  bossName: BossTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  cooldown: number;
}
