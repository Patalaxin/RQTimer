export interface IMobCatalog {
  _id: string;
  mobName: string;
  shortName: string;
  respawnText: string;
  location: string;
  cooldownTime: number;
  image: string;
  mobType: string;
}

export interface IGetMobsResponse {
  bossesArray: IMobCatalog[];
  elitesArray: IMobCatalog[];
}
