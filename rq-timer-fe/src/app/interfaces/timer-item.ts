export interface TimerItem {
  image: string;
  cooldownTime: number;
  mobType: 'Босс' | 'Элитка';
  bossName?: string;
  eliteName?: string;
  cooldown?: number;
  location?: string;
  respawnText?: string;
  server?: string;
  respawnTime?: number;
  deathTime?: number;
  shortName?: string;
  plusCooldown: number;
}
