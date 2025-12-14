import { History } from './history-types.interface';
import { Servers } from '../schemas/mobs.enum';
import { DeleteAllHistoryDtoResponse } from './dto/delete-history.dto';
import { PaginatedHistoryDto } from './dto/get-history.dto';

export interface IHistory {
  createHistory(history: History): Promise<History>;

  getAllHistory(
    server: Servers,
    groupName: string,
    page: number,
    limit: number,
    language?: string,
    historyType?: string,
  ): Promise<PaginatedHistoryDto>;

  getMobHistory(
    server: Servers,
    groupName: string,
    mobId: string,
    page: number,
    limit: number,
    language?: string,
  ): Promise<PaginatedHistoryDto>;

  deleteAll(
    server: Servers,
    groupName: string,
  ): Promise<DeleteAllHistoryDtoResponse>;
}
