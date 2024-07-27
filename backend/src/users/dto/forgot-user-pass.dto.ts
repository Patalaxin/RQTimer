import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPassword } from '../../decorators/isPassword.decorator';

export class ForgotUserPassDtoRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

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
