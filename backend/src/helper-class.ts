import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RolesTypes } from './schemas/user.schema';
import { GetFullMobWithUnixDtoResponse } from './mob/dto/get-mob.dto';
import { Locations, MobName, Servers } from './schemas/mobs.enum';
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
    updatedMobLocation: Locations,
    timezone: string,
    server: Servers,
  ): Promise<string> {
    const groupedByDate: Record<string, string[]> = {};

    for (const mobData of mobsInfo) {
      const respawnTime = mobData.mobData.respawnTime;
      if (!respawnTime) continue;

      const dateTime = DateTime.fromMillis(respawnTime).setZone(timezone);
      const date = dateTime.toFormat('dd.MM.yyyy');
      const time = dateTime.toFormat('HH:mm:ss');

      const isUpdated =
        mobData.mob.mobName === updatedMobName &&
        mobData.mob.location === updatedMobLocation;
      const updatedTag = isUpdated ? ' 🔄' : '';

      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }

      const { mobName, location, mobType } = mobData.mob;

      const line =
        mobType === 'Босс'
          ? `${mobName} - ${time}${updatedTag}`
          : `${mobName} - ${location} - ${time}${updatedTag}`;

      groupedByDate[date].push(line);
    }

    const sortedDates = Object.keys(groupedByDate).sort(
      (a, b) =>
        DateTime.fromFormat(a, 'dd.MM.yyyy').toMillis() -
        DateTime.fromFormat(b, 'dd.MM.yyyy').toMillis(),
    );

    let message = `Сервер: ${server} \nПо часовому поясу "${timezone}" респаун будет в:\n`;

    for (const date of sortedDates) {
      message += `\n${date}:\n`;
      for (const line of groupedByDate[date]) {
        message += `${line}\n`;
      }
    }

    return message.trim();
  }
}
