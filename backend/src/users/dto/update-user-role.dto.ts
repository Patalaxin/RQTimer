import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RolesTypes } from '../../schemas/user.schema';
import { IsNickname } from '../../decorators/isNickname.decorator';

export class UpdateUserRoleDtoRequest {
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
  @IsEnum(RolesTypes, { each: true })
  role: RolesTypes;
}

export class UpdateUserRoleDtoResponse {
  @ApiProperty({
    example: 'Role has been updated successfully!!!!',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 200,
  })
  @IsNumber()
  status: number;
}
