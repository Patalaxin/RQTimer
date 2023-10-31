import { IsNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class DeleteUserDtoResponse {
  @ApiProperty({
    example: 'User deleted',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 200,
  })
  @IsNumber()
  status: number;
}

export class DeleteAllUsersDtoResponse {
  @ApiProperty({
    example: 'All users deleted',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 200,
  })
  @IsNumber()
  status: number;
}
