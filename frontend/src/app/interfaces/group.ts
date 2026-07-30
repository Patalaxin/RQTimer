export interface IGroup {
  name: string;
  groupLeader: string;
  members: string[];
  canMembersAddMobs: boolean;
}

export interface IGroupMember {
  nickname: string;
  email: string;
  id?: number;
}
