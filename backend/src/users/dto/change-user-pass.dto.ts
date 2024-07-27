import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPassword } from '../../decorators/isPassword.decorator';

export class ChangeUserPassDtoRequest {
  @IsString()
  @IsNotEmpty()
  @IsPassword()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @IsPassword()
  newPassword: string;
}

export class ChangeUserPassDtoResponse {
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
