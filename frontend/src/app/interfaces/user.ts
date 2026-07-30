export type IUserRole = 'Admin' | 'User';

export interface IUser {
  _id: string;
  email: string;
  nickname: string;
  excludedMobs: string[];
  role: IUserRole;
  isGroupLeader: boolean;
  groupName?: string;
}
