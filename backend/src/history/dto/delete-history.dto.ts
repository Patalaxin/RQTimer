import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class DeleteAllHistoryDtoResponse {
  @ApiProperty({
    example: 'All History deleted',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 200,
  })
  @IsNumber()
  status: number;
}
