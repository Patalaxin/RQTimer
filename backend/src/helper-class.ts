import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RolesTypes } from './schemas/user.schema';

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
}
