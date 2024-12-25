import { ApiProperty } from '@nestjs/swagger';
import { ChestData } from '../../schemas/chest.schema';

export class ChestResponseDto {
  @ApiProperty({
    description: 'Список сундуков',
    type: [ChestData],
  })
  data: ChestData[];

  @ApiProperty({
    description: 'Общее количество сундуков, соответствующих запросу',
    example: 2,
  })
  total: number;
}
