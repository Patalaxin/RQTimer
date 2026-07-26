import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';

/**
 * Trusts the isGroupLeader claim from the JWT (via request.user, set by TokensGuard)
 * rather than re-checking the DB. Accepted trade-off: after a leadership transfer,
 * the old leader's still-valid access token stays "leader" for up to its remaining
 * TTL (15 min) — write operations are still safe because the group service itself
 * re-validates leadership against current DB state.
 */
@Injectable()
export class IsGroupLeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user?.isGroupLeader) {
      throw new ForbiddenException('Access Denied: User is not a group leader');
    }

    return true;
  }
}
