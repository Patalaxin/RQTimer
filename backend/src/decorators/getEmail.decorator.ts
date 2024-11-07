import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface DecodeResult {
  email: string;
  nickname: string;
  groupName: string;
  iat: number;
  exp: number;
}

export const GetEmailFromToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const jwtService = new JwtService();

      const token = request.headers.authorization.split(' ')[1];

      const { email } = jwtService.decode(token) as DecodeResult;

      return email;
    } catch (err) {
      throw new UnauthorizedException('Something wrong with token');
    }
  },
);
