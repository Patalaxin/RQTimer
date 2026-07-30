export interface IFullMob {
  mob: {
    _id: string;
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
    percent?: number;
  };
  mobData: {
    mobId: string;
    server?: string;
    respawnTime?: number;
    deathTime?: number;
    cooldown: number;
    respawnLost?: boolean;
    mobTypeAdditionalTime?: string;
    comment?: string;
  };
}

export interface ITimerItem extends IFullMob {
  unixtime: number;
}
