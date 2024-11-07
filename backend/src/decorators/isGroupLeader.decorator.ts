import { SetMetadata } from '@nestjs/common';

export const IS_GROUP_LEADER_KEY = 'isGroupLeader';
export const IsGroupLeader = () => SetMetadata(IS_GROUP_LEADER_KEY, true);
