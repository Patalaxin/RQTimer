import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class HelperClass {
  static counter: number = 0

  static getNicknameFromToken(request: Request, jwtService: JwtService): string {
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
    let actualCounter = ++this.counter;
    return `${actualCounter}`
  };
}
