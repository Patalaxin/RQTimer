import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HelperClass } from '../helper-class';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';

@Injectable()
export class TokensGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string = HelperClass.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      request['user'] = await this.jwtService.verifyAsync<AuthenticatedUser>(
        token,
        { secret: process.env.SECRET_CONSTANT },
      );
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
