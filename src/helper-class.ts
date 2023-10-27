import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class HelperClass {
  constructor() {}

  static getNicknameFromToken(request: Request, jwtService: JwtService) {
    interface DecodeResult {
      email: string;
      nickname: string;
      iat: number;
      exp: number;
    }

    const accessToken = request.headers.authorization?.split(' ')[1];
    const { nickname } = jwtService.decode(accessToken) as DecodeResult;
    return nickname;
  }
}
