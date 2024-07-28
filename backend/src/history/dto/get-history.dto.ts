import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MobName, Servers } from '../../schemas/mobs.enum';
import { Expose } from 'class-transformer';
import { Prop } from '@nestjs/mongoose';
import { RolesTypes } from '../../schemas/user.schema';

export class GetHistoryDtoResponse {
  @IsEnum(MobName)
  @IsNotEmpty()
  mobName: MobName;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsNotEmpty()
  date: number;

  @Expose()
  @Prop()
  role: RolesTypes;

  @IsNumber()
  @IsOptional()
  toWillResurrect?: number;

  @IsNumber()
  @IsOptional()
  fromCooldown?: number;

  @IsNumber()
  @IsOptional()
  toCooldown?: number;

  @IsBoolean()
  @IsOptional()
  crashServer?: boolean;
}
