import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

export interface DecodeResult {
  email: string;
  nickname: string;
  iat: number;
  exp: number;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    public jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    public reflector: Reflector,
  ) {}

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const { email } = this.jwtService.decode(token) as DecodeResult;
    const user = await this.userModel
      .find({ email: email })
      .select({ role: 1 });
    const userRole = user[0].role;
    return allowedRoles.includes(userRole);
  }
}
