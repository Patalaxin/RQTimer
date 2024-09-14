import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferLeaderDto {
  @ApiProperty({ example: 'newleader@example.com' })
  @IsEmail()
  readonly newLeaderEmail: string;
}
