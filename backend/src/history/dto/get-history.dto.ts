import { Locations, MobName, Servers } from '../../schemas/mobs.enum';
import { RolesTypes } from '../../schemas/user.schema';
import { HistoryTypes } from '../history-types.interface';
import { ApiProperty } from '@nestjs/swagger';

export class GetHistoryDtoResponse {
  @ApiProperty({ nullable: true })
  mobId?: string;

  @ApiProperty({ enum: MobName })
  mobName: MobName;

  @ApiProperty({ enum: Locations, nullable: true })
  location?: Locations;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ enum: Servers })
  server: Servers;

  @ApiProperty({ nullable: true })
  groupName?: string;

  @ApiProperty({ description: 'Unix time в миллисекундах' })
  date: number;

  @ApiProperty({ enum: RolesTypes })
  role: RolesTypes;

  @ApiProperty({ enum: HistoryTypes })
  historyTypes: HistoryTypes;

  @ApiProperty({ nullable: true, description: 'Unix time в миллисекундах' })
  toWillResurrect?: number;

  @ApiProperty({ nullable: true })
  fromCooldown?: number;

  @ApiProperty({ nullable: true })
  toCooldown?: number;

  @ApiProperty()
  crashServer?: boolean;
}

export class PaginatedHistoryDto {
  @ApiProperty({ type: [GetHistoryDtoResponse] })
  data: GetHistoryDtoResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pages: number;
}
