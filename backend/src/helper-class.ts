import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

export class HelperClass {
  static counter: number = 0;

  static getNicknameFromToken(
    request: Request,
    jwtService: JwtService,
  ): string {
    interface DecodeResult {
      email: string;
      nickname: string;
      iat: number;
      exp: number;
    }

    const accessToken: string = request.headers.authorization?.split(' ')[1];
    const { nickname } = jwtService.decode(accessToken) as DecodeResult;
    return nickname;
  }

  static async generateUniqueName() {
    const actualCounter: number = ++this.counter;
    return `${actualCounter}`;
  }
}
