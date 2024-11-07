import { IsArray, IsNotEmpty } from 'class-validator';
import { IsMobLocationFormat } from '../../decorators/IsMobLocationFormat.decorator';

export class AddMobInGroupDtoRequest {
  @IsArray()
  @IsNotEmpty()
  @IsMobLocationFormat({ each: true })
  mobs: string[];
}
