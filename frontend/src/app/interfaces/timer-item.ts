export interface TimerItem {
  mob: {
    mobsDataId?: {};
    mobName: string;
    cooldownTime: number;
    shortName: string;
    respawnText: string;
    location: string;
    image: string;
    server: string;
    mobType: string;
    plusCooldown: number;
    isDeathModalVisible: boolean;
    isDeathOkLoading: boolean;
    isHistoryModalVisible: boolean;
    isHistoryOkLoading: boolean;
    isEditModalVisible: boolean;
    isEditOkLoading: boolean;
  };
  mobData: {
    mobId?: {};
    respawnTime?: number;
    deathTime?: number;
    cooldown: number;
    respawnLost?: boolean;
    mobTypeAdditionalTime?: string;
  };
  unixtime: number;
}
