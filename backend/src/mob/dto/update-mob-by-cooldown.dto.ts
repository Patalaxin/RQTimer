import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsPositive } from '../../decorators/isPositiveOrZero.decorator';

export class UpdateMobByCooldownDtoRequest {
  @IsPositive()
  @IsNotEmpty()
  cooldown: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  comment: string;
}
