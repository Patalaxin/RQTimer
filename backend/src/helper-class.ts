import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RolesTypes } from './schemas/user.schema';
import { GetFullMobWithUnixDtoResponse } from './mob/dto/get-mob.dto';
import { MobName } from './schemas/mobs.enum';

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

  static async transformFindAllMobsResponse(
    mobsInfo: GetFullMobWithUnixDtoResponse[],
    updatedMobName: MobName,
  ): Promise<string> {
    let message = 'Осталось времени до респауна:\n\n';

    for (const mobData of mobsInfo) {
      const respawnTime = mobData.mobData.respawnTime;
      const currentTime = mobData.unixtime;
      const remainingTime = respawnTime ? respawnTime - currentTime : 0;

      if (remainingTime <= 0) {
        continue;
      }

      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remainingTime % (1000 * 60 * 60)) / (1000 * 60),
      );
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      const formattedTime = [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0'),
      ].join(':');

      const isUpdated = mobData.mob.mobName === updatedMobName;
      const updatedTag = isUpdated ? ' 🔄' : '';

      message += `${mobData.mob.mobName} - ${formattedTime}${updatedTag}\n`;
    }

    return message.trim();
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
}
