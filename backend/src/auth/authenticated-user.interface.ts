import { RolesTypes } from '../schemas/user.schema';

export interface AuthenticatedUser {
  email: string;
  nickname: string;
  role: RolesTypes;
  groupName: string;
  isGroupLeader: boolean;
  iat: number;
  exp: number;
}
