import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPassword } from '../../decorators/isPassword.decorator';
import { IsNickname } from '../../decorators/isNickname.decorator';

export class ForgotUserPassDtoRequest {
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @IsNickname()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsNotEmpty()
  @IsPassword()
  newPassword: string;
}

export class ForgotUserPassDtoResponse {
  @ApiProperty({
    example: 'Password successfully changed',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 200,
  })
  @IsNumber()
  status: number;
}
