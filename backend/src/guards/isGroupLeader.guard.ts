import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class IsGroupLeaderGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userEmail = request.user?.email;

    if (!userEmail) {
      throw new ForbiddenException('Access Denied: No user email found');
    }

    const user = await this.userModel.findOne({ email: userEmail });
    if (!user || !user.isGroupLeader) {
      throw new ForbiddenException('Access Denied: User is not a group leader');
    }

    return true;
  }
}
