import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RolesTypes, User, UserDocument } from '../schemas/user.schema';
import { HelperClass } from '../helper-class';

export interface DecodeResult {
  email: string;
  nickname: string;
  role: RolesTypes;
  groupName: string;
  isGroupLeader: boolean;
  iat: number;
  exp: number;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles: RolesTypes[] = this.reflector.get<RolesTypes[]>(
      'roles',
      context.getHandler(),
    );

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token: string = HelperClass.extractTokenFromHeader(request);

    let decodedToken: DecodeResult;
    try {
      decodedToken = this.jwtService.decode(token) as DecodeResult;
    } catch (e) {
      throw new BadRequestException('Invalid token');
    }

    if (!decodedToken || !decodedToken.email) {
      throw new BadRequestException('Invalid token');
    }

    const user = await this.userModel
      .findOne({ email: decodedToken.email })
      .select({ role: 1 });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const userRole: RolesTypes = user.role;
    return allowedRoles.includes(userRole);
  }
}
