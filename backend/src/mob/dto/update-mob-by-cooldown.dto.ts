import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MobsLocations, MobName, Servers } from '../../schemas/mobs.enum';
import { IsPositive } from '../../decorators/isPositiveOrZero.decorator';

export class UpdateMobByCooldownDtoRequest {
  @IsEnum(MobName)
  @IsNotEmpty()
  mobName: MobName;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsEnum(MobsLocations)
  @IsOptional()
  location: MobsLocations;

  @IsPositive()
  @IsNotEmpty()
  cooldown: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  comment: string;
}
