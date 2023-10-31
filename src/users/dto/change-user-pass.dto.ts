import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserPassDtoRequest {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ChangeUserPassDtoResponse {
  @ApiProperty({
    example: 'Password successfully changed',
  })
  @IsString()
  message: string;

  @ApiProperty()
  @IsNumber()
  status: number;
}
