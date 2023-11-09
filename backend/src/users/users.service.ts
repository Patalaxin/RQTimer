import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDtoRequest } from './dto/create-user.dto';
import { UpdateExcludedDto } from './dto/update-excluded.dto';
import { UpdateUnavailableDto } from './dto/update-unavailable.dto';
import {
  ChangeUserPassDtoRequest,
  ChangeUserPassDtoResponse,
} from './dto/change-user-pass.dto';
import {
  ForgotUserPassDtoRequest,
  ForgotUserPassDtoResponse,
} from './dto/forgot-user-pass.dto';
import {
  UpdateUserRoleDtoRequest,
  UpdateUserRoleDtoResponse,
} from './dto/update-user-role.dto';
import { User, UserDocument } from '../schemas/user.schema';
import { SessionId, SessionIdDocument } from '../schemas/sessionID.schema';
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoResponse,
} from './dto/delete-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SessionId.name)
    private sessionIdModel: Model<SessionIdDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDtoRequest): Promise<User> {
    const userEmail = await this.userModel
      .findOne({ email: createUserDto.email })
      .lean()
      .exec();
    const userNickname = await this.userModel
      .findOne({ nickname: createUserDto.nickname })
      .lean()
      .exec();

    if (userEmail || userNickname) {
      throw new BadRequestException(
        'A user with such an email or nickname already exists!',
      );
    }

    const compareSessionId = await this.sessionIdModel.findOne({
      _id: { $eq: createUserDto.sessionId },
    });
    if (compareSessionId === null) {
      throw new BadRequestException('Wrong SessionId!');
    }
    try {
      await this.sessionIdModel.deleteMany({});
      const newUser = await this.userModel.create(createUserDto);
      newUser.password = await bcrypt.hash(newUser.password, 10);
      await newUser.save();
      return newUser.toObject();
    } catch (err) {
      throw new BadRequestException('Something went wrong!');
    }
  }

  async findUser(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email: email }).lean().exec();
    if (!user) {
      throw new BadRequestException('User does not exist!');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    try {
      return this.userModel
        .find()
        .select({ email: 1, _id: 1, nickname: 1 })
        .lean()
        .exec();
    } catch (err) {
      throw new BadRequestException('Something went wrong');
    }
  }

  async changePassword(
    email: string,
    updateUserPassDto: ChangeUserPassDtoRequest,
  ): Promise<ChangeUserPassDtoResponse> {
    const user: User = await this.findUser(email);

    const isPasswordMatch: boolean = await bcrypt.compare(
      updateUserPassDto.oldPassword,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Password did not match!!!');
    }

    let hashedNewPassword: string = await bcrypt.hash(
      updateUserPassDto.newPassword,
      10,
    );
    await this.userModel.updateOne(
      { email: user.email },
      { password: hashedNewPassword },
    );

    return { message: 'Password successfully changed', status: 200 };
  }

  async forgotPassword(
    forgotUserPassDto: ForgotUserPassDtoRequest,
  ): Promise<ForgotUserPassDtoResponse> {
    const user: User = await this.findUser(forgotUserPassDto.email);

    const compareSessionId = await this.sessionIdModel.findOne({
      _id: { $eq: forgotUserPassDto.sessionId },
    });
    if (compareSessionId === null) {
      throw new BadRequestException('Wrong SessionId!');
    }

    await this.sessionIdModel.deleteMany({});
    let hashedNewPassword: string = await bcrypt.hash(
      forgotUserPassDto.newPassword,
      10,
    );
    await this.userModel.updateOne(
      { email: user.email },
      { password: hashedNewPassword },
    );

    return { message: 'Password successfully changed', status: 200 };
  }

  async updateUnavailable(
    updateUnavailableDto: UpdateUnavailableDto,
  ): Promise<User> {
    try {
      const user: User = await this.findUser(updateUnavailableDto.email);
      await this.userModel
        .updateOne(
          { email: user.email },
          {
            unavailableBosses: updateUnavailableDto.unavailableBosses,
            unavailableElites: updateUnavailableDto.unavailableElites,
          },
          { new: true },
        )
        .lean()
        .exec();
      return user;
    } catch (err) {
      throw new BadRequestException('Something went wrong!');
    }
  }

  async updateExcluded(
    email: string,
    updateExcludedDto: UpdateExcludedDto,
  ): Promise<User> {
    const user = await this.findUser(email);
    await this.userModel
      .updateOne(
        { email: user.email },
        {
          excludedBosses: updateExcludedDto.excludedBosses,
          excludedElites: updateExcludedDto.excludedElites,
        },
        { new: true },
      )
      .lean()
      .exec();
    return user;
  }

  async updateRole(
    updateUserRoleDto: UpdateUserRoleDtoRequest,
  ): Promise<UpdateUserRoleDtoResponse> {
    try {
      const user = await this.findUser(updateUserRoleDto.email);
      await this.userModel
        .updateOne(
          { email: user.email },
          { role: updateUserRoleDto.role },
          { new: true },
        )
        .lean()
        .exec();
    } catch (err) {
      throw new BadRequestException('Something went wrong!');
    }
    return { message: 'Role has been updated successfully', status: 200 };
  }

  async deleteOne(email: string): Promise<DeleteUserDtoResponse> {
    try {
      await this.userModel.deleteOne({ email: email });
    } catch (err) {
      throw new BadRequestException('Something went wrong ');
    }
    return { message: 'User deleted', status: 200 };
  }

  async deleteAll(): Promise<DeleteAllUsersDtoResponse> {
    try {
      await this.userModel.deleteMany();
    } catch (err) {
      throw new BadRequestException('Something went wrong ');
    }
    return { message: 'All users deleted', status: 200 };
  }

  async generateSessionId(): Promise<SessionId> {
    try {
      await this.sessionIdModel.deleteMany({});
      let sessionId = await this.sessionIdModel.create({ _id: randomUUID() });
      return sessionId.toObject();
    } catch (err) {
      throw new BadRequestException('Something went wrong');
    }
  }
}
