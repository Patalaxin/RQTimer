import { MobName, Servers } from '../schemas/mobs.enum';
import { RolesTypes } from '../schemas/user.schema';

export interface History {
  mobName: MobName;
  nickname: string;
  server: Servers;
  date: number;
  role: RolesTypes;
  toWillResurrect?: number;
  fromCooldown?: number;
  toCooldown?: number;
  crashServer?: boolean;
}
