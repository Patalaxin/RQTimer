export interface IUserOnlineStatus {
  email: string;
  status: 'online' | 'offline';
}

export interface IOnlineUser {
  email: string;
  socketId: string;
  groupName: string;
}
