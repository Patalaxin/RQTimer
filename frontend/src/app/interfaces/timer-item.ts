export interface TimerItem {
  mob: {
    mobsDataId?: {};
    mobName: string;
    cooldownTime: number;
    shortName: string;
    respawnText: string;
    location: string;
    image: string;
    mobType: string;
    plusCooldown: number;
    isDeathModalVisible: boolean;
    isDeathOkLoading: boolean;
    isOnDieNow: boolean;
    isHistoryModalVisible: boolean;
    isHistoryOkLoading: boolean;
    isInfoModalVisible: boolean;
    isInfoOkLoading: boolean;
  };
  mobData: {
    server?: string;
    mobId?: {};
    respawnTime?: number;
    deathTime?: number;
    cooldown: number;
    respawnLost?: boolean;
    mobTypeAdditionalTime?: string;
    comment?: string;
  };
  unixtime: number;
}
