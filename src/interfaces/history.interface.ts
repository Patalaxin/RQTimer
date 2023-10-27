import { BossTypes, EliteTypes, Servers } from '../schemas/mobs.enum';

export interface History {
  bossName?: BossTypes;
  eliteName?: EliteTypes;
  nickname: string;
  server: Servers;
  date: number;
  toWillResurrect?: number;
  fromCooldown?: number;
  toCooldown?: number;
  crashServer?: boolean;
}
