import { Servers } from "../schemas/bosses.enum";

export interface History {
  bossName: string,
  nickname: string,
  server: Servers,
  date: number,
  toWillResurrect?: number,
  fromCooldown?: number,
  toCooldown?: number,
  crashServer?: boolean
}
