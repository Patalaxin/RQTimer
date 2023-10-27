import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsArray,
  IsEnum,
  ArrayUnique,
} from 'class-validator';
import { BossTypes, EliteTypes } from '../../schemas/bosses.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDtoRequest {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Боссы которых пользователь не хочет видеть',
    enum: BossTypes,
    isArray: true,
    example: [BossTypes.Архон, BossTypes.Хьюго],
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(BossTypes, { each: true })
  excludedBosses: BossTypes[];

  @ApiProperty({
    description: 'Элита которых пользователь не хочет видеть',
    enum: EliteTypes,
    isArray: true,
    example: [EliteTypes.Лякуша, EliteTypes.Пламярык],
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(EliteTypes, { each: true })
  excludedElites: EliteTypes[];
}
