import { ApiProperty } from '@nestjs/swagger';

/**
 * Форма группы, которую отдаёт API. Инвайт-код сюда намеренно не входит:
 * в Mongo-схеме он был помечен @Exclude(), и получить его можно только
 * через POST /groups/invite.
 */
export class GroupResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: String })
  groupLeader: string;

  @ApiProperty({
    type: [String],
    description: 'List of members in the format "nickname: email"',
  })
  members: string[];

  @ApiProperty({ type: Boolean, description: 'Can members add mobs' })
  canMembersAddMobs: boolean;
}
