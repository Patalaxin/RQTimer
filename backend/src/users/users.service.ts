import { BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDtoRequest } from './dto/create-user.dto';
import { UpdateExcludedDto } from './dto/update-excluded.dto';
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
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoResponse,
} from './dto/delete-user.dto';
import { IUser } from './user.interface';
import { Token, TokenDocument } from '../schemas/refreshToken.schema';
import { PaginatedUsersDto } from './dto/findAll-user.dto';
import { OtpService } from '../OTP/otp.service';
import { BotSession, BotSessionDocument } from '../schemas/telegram-bot.schema';

export class UsersService implements IUser {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(BotSession.name)
    private readonly sessionModel: Model<BotSessionDocument>,
    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,
  ) {}

  async createUser(createUserDto: CreateUserDtoRequest): Promise<User> {
    const { email } = createUserDto;

    if (!this.otpService.isEmailVerified(email)) {
      throw new BadRequestException('Email has not been verified through OTP!');
    }

    const existingUser: User = await this.userModel
      .findOne({
        $or: [
          { email: new RegExp(`^${email}$`, 'i') },
          { nickname: new RegExp(`^${createUserDto.nickname}$`, 'i') },
        ],
      })
      .lean()
      .exec();

    if (existingUser) {
      throw new BadRequestException(
        'A user with this email or nickname already exists!',
      );
    }

    try {
      const hashedPassword: string = await bcrypt.hash(
        createUserDto.password,
        10,
      );
      const newUser = await this.userModel.create({
        ...createUserDto,
        password: hashedPassword,
      });

      this.otpService.removeVerifiedEmail(createUserDto.email);
      return newUser.toObject();
    } catch {
      throw new BadRequestException('Something went wrong!');
    }
  }

  async findUser(nicknameOrEmail: string): Promise<User> {
    const user: User = await this.userModel
      .findOne({
        $or: [
          { email: new RegExp(`^${nicknameOrEmail}$`, 'i') },
          { nickname: new RegExp(`^${nicknameOrEmail}$`, 'i') },
        ],
      })
      .lean()
      .exec();

    if (!user) {
      throw new BadRequestException('User does not exist!');
    }
    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedUsersDto> {
    try {
      const skip = (page - 1) * limit;
      const total = await this.userModel.countDocuments().exec();
      const pages = Math.ceil(total / limit);

      const data = await this.userModel
        .find()
        .select({ email: 1, _id: 1, nickname: 1, role: 1, groupName: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      return {
        data,
        total,
        page,
        pages,
      };
    } catch {
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
      throw new BadRequestException('Password did not match!!!');
    }

    const hashedNewPassword: string = await bcrypt.hash(
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
    if (forgotUserPassDto.email && forgotUserPassDto.nickname) {
      throw new BadRequestException(
        'Email and Nickname fields should not be together',
      );
    } else if (!forgotUserPassDto.email && !forgotUserPassDto.nickname) {
      throw new BadRequestException(
        'The "Email" or "Nickname" fields must be specified',
      );
    }

    if (!this.otpService.isEmailVerified(forgotUserPassDto.email)) {
      throw new BadRequestException('Email has not been verified through OTP!');
    }

    const query = forgotUserPassDto.email
      ? { email: new RegExp(`^${forgotUserPassDto.email}$`, 'i') }
      : { nickname: new RegExp(`^${forgotUserPassDto.nickname}$`, 'i') };

    const hashedNewPassword: string = await bcrypt.hash(
      forgotUserPassDto.newPassword,
      10,
    );

    const updatedUser: User = await this.userModel
      .findOneAndUpdate(query, { password: hashedNewPassword }, { new: true })
      .lean()
      .exec();

    if (!updatedUser) {
      throw new BadRequestException('User not found!');
    }

    this.otpService.removeVerifiedEmail(forgotUserPassDto.email);

    return { message: 'Password successfully changed', status: 200 };
  }

  async updateExcluded(
    email: string,
    updateExcludedDto: UpdateExcludedDto,
  ): Promise<User> {
    return await this.userModel
      .findOneAndUpdate(
        { email },
        {
          excludedMobs: updateExcludedDto.excludedMobs,
        },
        { new: true },
      )
      .lean()
      .exec();
  }

  async updateRole(
    updateUserRoleDto: UpdateUserRoleDtoRequest,
  ): Promise<UpdateUserRoleDtoResponse> {
    if (updateUserRoleDto.email && updateUserRoleDto.nickname) {
      throw new BadRequestException(
        'Email and Nickname fields should not be together',
      );
    } else if (!updateUserRoleDto.email && !updateUserRoleDto.nickname) {
      throw new BadRequestException(
        'The "Email" or "Nickname" fields must be specified',
      );
    }
    const query = updateUserRoleDto.email
      ? { email: new RegExp(`^${updateUserRoleDto.email}$`, 'i') }
      : { nickname: new RegExp(`^${updateUserRoleDto.nickname}$`, 'i') };

    try {
      await this.userModel
        .findOneAndUpdate(
          query,
          { role: updateUserRoleDto.role },
          { new: true },
        )
        .lean()
        .exec();
    } catch {
      throw new BadRequestException('Something went wrong!');
    }
    return { message: 'Role has been updated successfully', status: 200 };
  }

  async deleteOne(identifier: string): Promise<DeleteUserDtoResponse> {
    if (!identifier) {
      throw new BadRequestException(
        'The "identifier" header must be specified',
      );
    }

    const deleteQuery = {
      $or: [
        { email: new RegExp(`^${identifier}$`, 'i') },
        { nickname: new RegExp(`^${identifier}$`, 'i') },
      ],
    };

    try {
      await this.userModel.deleteOne(deleteQuery);
      await this.tokenModel.findOneAndDelete(deleteQuery);
    } catch {
      throw new BadRequestException('Something went wrong');
    }
    return { message: 'User deleted', status: 200 };
  }

  async deleteAll(): Promise<DeleteAllUsersDtoResponse> {
    try {
      await this.userModel.deleteMany();
      await this.tokenModel.deleteMany();
    } catch {
      throw new BadRequestException('Something went wrong ');
    }
    return { message: 'All users deleted', status: 200 };
  }

  async updateTimezone(email: string, timezone: string): Promise<BotSession> {
    return this.sessionModel
      .findOneAndUpdate({ email }, { timezone }, { new: true, upsert: true })
      .lean()
      .exec();
  }
}
