import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RolesTypes } from './schemas/user.schema';
import { GetFullMobWithUnixDtoResponse } from './mob/dto/get-mob.dto';
import { MobName } from './schemas/mobs.enum';
import { DateTime } from 'luxon';

export class HelperClass {
  static counter: number = 0;

  static getNicknameAndRoleFromToken(
    request: Request,
    jwtService: JwtService,
  ): { role: RolesTypes; nickname: string } {
    interface DecodeResult {
      email: string;
      nickname: string;
      role: RolesTypes;
      iat: number;
      exp: number;
    }

    const accessToken: string = request.headers.authorization?.split(' ')[1];
    const { nickname, role } = jwtService.decode(accessToken) as DecodeResult;
    return { nickname, role };
  }

  static async generateUniqueName() {
    const actualCounter: number = ++this.counter;
    return `${actualCounter}`;
  }

  static extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  static filterMobsForUser(
    fullMessage: string,
    unavailableMobs: string[],
    excludedMobs: string[],
  ): string {
    return fullMessage
      .split('\n')
      .filter((line) => {
        const [mobName] = line.split(' - ');

        return (
          !unavailableMobs.includes(mobName) && !excludedMobs.includes(mobName)
        );
      })
      .map((line) => {
        return line;
      })
      .join('\n');
  }

  static async transformFindAllMobsResponse(
    mobsInfo: GetFullMobWithUnixDtoResponse[],
    updatedMobName: MobName,
    timezone: string,
  ): Promise<string> {
    let message = `По ${timezone} респаун будет в :\n\n`;

    for (const mobData of mobsInfo) {
      const respawnTime = mobData.mobData.respawnTime;

      if (!respawnTime) {
        continue;
      }

      const localTime = DateTime.fromMillis(respawnTime)
        .setZone(timezone)
        .toFormat('dd.MM.yyyy HH:mm:ss');

      const isUpdated = mobData.mob.mobName === updatedMobName;
      const updatedTag = isUpdated ? ' 🔄' : '';

      message += `${mobData.mob.mobName} - ${localTime}${updatedTag}\n`;
    }

    return message.trim();
  }
}
