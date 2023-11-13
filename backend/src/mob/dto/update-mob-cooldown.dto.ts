import { IsEnum, IsNotEmpty } from 'class-validator';
import { Locations, MobName, Servers } from '../../schemas/mobs.enum';
import { IsPositiveOrZero } from '../../decorators/isPositiveOrZero.decorator';

export class UpdateMobCooldownDtoRequest {
  @IsEnum(MobName)
  @IsNotEmpty()
  mobName: MobName;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsEnum(Locations)
  @IsNotEmpty()
  location: Locations;

  @IsPositiveOrZero()
  @IsNotEmpty()
  cooldown: number;
}
