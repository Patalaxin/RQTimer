import { ApiProperty } from '@nestjs/swagger';
import { Servers } from '../../schemas/mobs.enum';

export class GetServersDtoResponse {
  @ApiProperty({ enum: Servers, isArray: true })
  servers: Servers[];
}
