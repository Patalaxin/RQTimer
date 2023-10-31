import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { RolesTypes } from '../../schemas/user.schema';

export class UpdateUserRoleDtoRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsEnum(RolesTypes, { each: true })
  role: RolesTypes;
}

export class UpdateUserRoleDtoResponse {
  @ApiProperty({
    example: 'the Role has been updated successfully',
  })
  @IsString()
  message: string;

  @ApiProperty()
  @IsNumber()
  status: number;
}
