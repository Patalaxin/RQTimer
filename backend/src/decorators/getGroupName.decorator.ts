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

export const GetGroupNameFromToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const jwtService = new JwtService();

      const token = request.headers.authorization.split(' ')[1];

      const { groupName } = jwtService.decode(token) as DecodeResult;

      return groupName;
    } catch (err) {
      throw new UnauthorizedException('Something wrong with token');
    }
  },
);
