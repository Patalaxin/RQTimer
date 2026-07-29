import { ApiProperty } from '@nestjs/swagger';
import { MobName } from '../../schemas/mobs.enum';
import { RolesTypes } from '../../schemas/roles.enum';

/**
 * Пользователь в том виде, в каком его отдаёт API. Хэш пароля сюда не попадает
 * по построению — раньше его прятал @Exclude() на mongoose-классе.
 */
export class UserResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({
    description: 'Мобы которых пользователь не хочет видеть',
    enum: MobName,
    isArray: true,
    example: [MobName.Архон, MobName.Хьюго],
  })
  excludedMobs: string[];

  @ApiProperty({ enum: RolesTypes })
  role: RolesTypes;

  @ApiProperty()
  isGroupLeader: boolean;

  @ApiProperty({ nullable: true })
  groupName: string | null;
}
