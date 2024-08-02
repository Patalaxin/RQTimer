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
import { HistoryTypes } from '../history.interface';
import { ApiProperty } from '@nestjs/swagger';

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

  @Expose()
  @Prop()
  historyTypes: HistoryTypes;

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

export class PaginatedHistoryDto {
  @ApiProperty({ type: [GetHistoryDtoResponse] })
  data: GetHistoryDtoResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pages: number;
}
