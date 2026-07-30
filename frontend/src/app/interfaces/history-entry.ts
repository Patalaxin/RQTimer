export type IHistoryActionType =
  | 'updateMobByCooldown'
  | 'updateMobDateOfDeath'
  | 'updateMobDateOfRespawn'
  | 'crashMobServer'
  | 'respawnLost';

export interface IHistoryEntry {
  mobId?: string;
  mobName: string;
  location?: string;
  nickname: string;
  server: string;
  groupName?: string;
  date: number;
  role: string;
  historyTypes: IHistoryActionType;
  toWillResurrect?: number;
  fromCooldown?: number;
  toCooldown?: number;
  crashServer?: boolean;
}

export interface IPaginatedHistory {
  data: IHistoryEntry[];
  total: number;
  page: number;
  pages: number;
}
