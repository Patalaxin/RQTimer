export interface TimerItem1 {
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

export interface TimerItem {
  mob: {
    mobsDataId?: {};
    mobName: string;
    cooldownTime: number;
    shortName?: string;
    respawnText?: string;
    location: string;
    image?: string;
    server: string;
    mobType?: string;
    plusCooldown: number;
    isDeathModalVisible: boolean;
    isDeathOkLoading: boolean;
    isHistoryModalVisible: boolean;
    isHistoryOkLoading: boolean;
  };
  mobData: {
    mobId?: {};
    respawnTime?: number;
    deathTime?: number;
    cooldown: number;
    respawnLost?: boolean;
    mobTypeAdditionalTime?: string;
  };
  // isTimerRunning?: boolean; // Флаг для отслеживания состояния таймера
  // timeoutId?: any; // Идентификатор таймера
}
