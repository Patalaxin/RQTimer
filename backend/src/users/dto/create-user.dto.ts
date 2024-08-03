import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsArray,
  IsEnum,
  ArrayUnique,
} from 'class-validator';
import { MobName } from '../../schemas/mobs.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsPassword } from '../../decorators/isPassword.decorator';
import { IsNickname } from '../../decorators/isNickname.decorator';

export class CreateUserDtoRequest {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @IsNickname()
  nickname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsPassword()
  password: string;

  @ApiProperty({
    description: 'Мобы которых пользователь не хочет видеть',
    enum: MobName,
    isArray: true,
    example: [MobName.Архон, MobName.Хьюго],
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(MobName, { each: true })
  excludedMobs: MobName[];
}
