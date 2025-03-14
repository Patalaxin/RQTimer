import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RolesTypes } from './schemas/user.schema';
import { GetFullMobWithUnixDtoResponse } from './mob/dto/get-mob.dto';

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
  ): Promise<string> {
    let message = '';

    for (const mobData of mobsInfo) {
      const respawnTime = mobData.mobData.respawnTime;
      const currentTime = Date.now();
      const remainingTime = respawnTime ? respawnTime - currentTime : 0;

      if (remainingTime <= 0) {
        continue;
      }

      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remainingTime % (1000 * 60 * 60)) / (1000 * 60),
      );
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

      const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

      message += `${mobData.mob.shortName} - ${formattedTime}\n`;
    }

    return message;
  }
}
