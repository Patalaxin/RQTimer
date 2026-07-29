import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';

/**
 * Reads the user populated by TokensGuard (request.user) — the JWT is verified
 * exactly once, by the guard. Pass a key to pluck a single field, e.g. @GetUser('email').
 */
export const GetUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    return data ? user?.[data] : user;
  },
);
