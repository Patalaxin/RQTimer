import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { RolesTypes, User, UserDocument } from '../schemas/user.schema';

export interface DecodeResult {
  email: string;
  nickname: string;
  iat: number;
  exp: number;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    public jwtService: JwtService,
    public reflector: Reflector,
  ) {}

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles: RolesTypes[] = this.reflector.get<RolesTypes[]>(
      'roles',
      context.getHandler(),
    );

    if (allowedRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const token: string = this.extractTokenFromHeader(request);
    const decodedToken = this.jwtService.decode(token) as DecodeResult;
    if (!decodedToken || !decodedToken.email) {
      throw new BadRequestException('Invalid token');
    }
    try {
      const user = await this.userModel
        .find({ email: decodedToken.email })
        .select({ role: 1 });
      const userRole: RolesTypes = user[0].role;
      return allowedRoles.includes(userRole);
    } catch (err) {
      throw new BadRequestException(
        'Probably this user does not exist anymore',
      );
    }
  }
}
