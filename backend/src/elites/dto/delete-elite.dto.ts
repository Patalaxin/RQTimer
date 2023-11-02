import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteEliteDtoResponse {
  @ApiProperty({
    example: 'Elite deleted',
  })
  @IsString()
  message: string;
}
