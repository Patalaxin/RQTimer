import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPassword } from '../../decorators/isPassword.decorator';
import { IsNickname } from '../../decorators/isNickname.decorator';

export class CreateUserDtoRequest {
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
    description: 'Мобы, которых пользователь не хочет видеть',
    type: [String],
    example: ['665f1a15a7bbbdc01c56eefe', '665f1a15a7bbbdc01c56eeff'], // примеры ObjectId
  })
  @IsArray()
  @IsMongoId({ each: true })
  excludedMobs: string[];
}
