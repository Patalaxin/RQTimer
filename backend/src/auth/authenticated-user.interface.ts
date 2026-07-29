import { RolesTypes } from '../schemas/roles.enum';

export interface AuthenticatedUser {
  email: string;
  nickname: string;
  role: RolesTypes;
  groupName: string;
  isGroupLeader: boolean;
  iat: number;
  exp: number;
}
