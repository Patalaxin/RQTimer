import { MobName, Servers } from '../schemas/mobs.enum';

export interface History {
  mobName: MobName;
  nickname: string;
  server: Servers;
  date: number;
  toWillResurrect?: number;
  fromCooldown?: number;
  toCooldown?: number;
  crashServer?: boolean;
}
