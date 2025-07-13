import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { RolesTypes } from '../../schemas/user.schema';
import { IsNickname } from '../../decorators/isNickname.decorator';

export class FindAllUsersDtoResponse {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsNickname()
  nickname: string;

  @ApiProperty()
  @IsString()
  groupName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  _id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role: RolesTypes;
}

export class PaginatedUsersDto {
  data: FindAllUsersDtoResponse[];
  total: number;
  page: number;
  pages: number;
}
