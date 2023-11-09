import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsArray,
  IsEnum,
  ArrayUnique,
} from 'class-validator';
import { BossTypes, EliteTypes } from '../../schemas/mobs.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsPassword } from "../../decorators/isPassword.decorator";

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
  @IsPassword()
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
