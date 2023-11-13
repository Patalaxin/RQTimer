import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteMobDtoResponse {
  @ApiProperty({
    example: 'Mob deleted',
  })
  @IsString()
  message: string;
}
