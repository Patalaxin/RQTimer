import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteBossDtoResponse {
  @ApiProperty({
    example: 'Boss deleted',
  })
  @IsString()
  message: string;
}
