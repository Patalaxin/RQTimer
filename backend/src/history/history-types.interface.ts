import { Locations, MobName, Servers } from '../schemas/mobs.enum';
import { RolesTypes } from '../schemas/user.schema';

export enum HistoryTypes {
  updateMobByCooldown = 'updateMobByCooldown',
  updateMobDateOfDeath = 'updateMobDateOfDeath',
  updateMobDateOfRespawn = 'updateMobDateOfRespawn',
  crashMobServer = 'crashMobServer',
  respawnLost = 'respawnLost',
}

export interface History {
  mobId?: string;
  mobName: MobName;
  nickname: string;
  server: Servers;
  groupName?: string;
  location?: Locations;
  date: number;
  role: RolesTypes;
  historyTypes: HistoryTypes;
  toWillResurrect?: number;
  fromCooldown?: number;
  toCooldown?: number;
  crashServer?: boolean;
}
