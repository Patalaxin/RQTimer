import { UnixtimeResponseDto } from './dto/get-unixtime.dto';

export interface IUnixtime {
  getUnixtime(): Promise<UnixtimeResponseDto>;
}
