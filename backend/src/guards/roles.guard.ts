import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesTypes } from '../schemas/user.schema';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';

/**
 * Trusts request.user populated by TokensGuard — must run after it
 * (put both in the same @UseGuards(TokensGuard, RolesGuard) call).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles: RolesTypes[] = this.reflector.get<RolesTypes[]>(
      'roles',
      context.getHandler(),
    );

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new UnauthorizedException();
    }

    return allowedRoles.includes(user.role);
  }
}
