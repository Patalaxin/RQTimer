import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateGroupDto {
  @IsBoolean()
  @IsOptional()
  canMembersAddMobs?: boolean;
}
