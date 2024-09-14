import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinGroupDto {
  @ApiProperty({ example: 'abc123' })
  @IsString()
  readonly inviteCode: string;
}
