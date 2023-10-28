import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EliteTypes, Locations, Servers } from '../../schemas/mobs.enum';

export class GetElitesDtoRequest {
  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;
}

export class GetElitesDtoResponse {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Locations)
  @IsNotEmpty()
  location: Locations;

  @IsNumber()
  @IsNotEmpty()
  willResurrect: number;

  @IsNumber()
  @IsOptional()
  cooldown: number;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsNumber()
  @IsOptional()
  cooldownTime: number;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsString()
  @IsNotEmpty()
  _id: string;
}