import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_GROUP_LEADER_KEY } from '../decorators/isGroupLeader.decorator';
import { HelperClass } from '../helper-class';
import { DecodeResult } from './roles.guard';

@Injectable()
export class IsGroupLeaderGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isGroupLeader = this.reflector.get<boolean>(
      IS_GROUP_LEADER_KEY,
      context.getHandler(),
    );

    if (!isGroupLeader) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token: string = HelperClass.extractTokenFromHeader(request);

    let decodedToken: DecodeResult;
    try {
      decodedToken = this.jwtService.decode(token) as DecodeResult;
    } catch (e) {
      throw new ForbiddenException('Invalid token');
    }

    if (!decodedToken || decodedToken.isGroupLeader !== true) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
