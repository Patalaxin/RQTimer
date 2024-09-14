import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'MyGroup' })
  @IsString()
  readonly name: string;
}
