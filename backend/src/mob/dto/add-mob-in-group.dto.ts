import { IsArray, IsMongoId } from 'class-validator';

export class AddMobInGroupDtoRequest {
  @IsArray()
  @IsMongoId({ each: true })
  mobs: string[];
}
