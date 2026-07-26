import { BadRequestException, Injectable } from '@nestjs/common';
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
import { RolesTypes } from '../schemas/roles.enum';
import { UserResponseDto } from './dto/user-response.dto';
import {
  DeleteAllUsersDtoResponse,
  DeleteUserDtoResponse,
} from './dto/delete-user.dto';
import { PaginatedUsersDto } from './dto/findAll-user.dto';
import { OtpService } from '../OTP/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { BotSession, Prisma, Role } from '@prisma/client';

type PrismaUser = Prisma.UserGetPayload<Record<string, never>>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
  ) {}

  private toResponse(user: PrismaUser): UserResponseDto {
    return {
      _id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role as unknown as RolesTypes,
      isGroupLeader: user.isGroupLeader,
      groupName: user.groupName,
      excludedMobs: user.excludedMobs,
    };
  }

  async createUser(createUserDto: CreateUserDtoRequest): Promise<UserResponseDto> {
    const { email, nickname, password, excludedMobs } = createUserDto;

    if (!(await this.otpService.isEmailVerified(email))) {
      throw new BadRequestException('Email has not been verified through OTP!');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { nickname: { equals: nickname, mode: 'insensitive' } },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'A user with this email or nickname already exists!',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.user.create({
      data: { email, nickname, passwordHash, excludedMobs: excludedMobs ?? [] },
    });

    await this.otpService.removeVerifiedEmail(email);
    return this.toResponse(newUser);
  }

  async findUser(nicknameOrEmail: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: nicknameOrEmail, mode: 'insensitive' } },
          { nickname: { equals: nicknameOrEmail, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      throw new BadRequestException('User does not exist!');
    }
    return this.toResponse(user);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedUsersDto> {
    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        select: { id: true, email: true, nickname: true, role: true, groupName: true },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data.map((user) => ({
        _id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role as unknown as RolesTypes,
        groupName: user.groupName,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async changePassword(
    email: string,
    updateUserPassDto: ChangeUserPassDtoRequest,
  ): Promise<ChangeUserPassDtoResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { email } });

    const isPasswordMatch = await bcrypt.compare(
      updateUserPassDto.oldPassword,
      user.passwordHash,
    );
    if (!isPasswordMatch) {
      throw new BadRequestException('Password did not match!!!');
    }

    const hashedNewPassword = await bcrypt.hash(
      updateUserPassDto.newPassword,
      10,
    );
    await this.prisma.user.update({
      where: { email: user.email },
      data: { passwordHash: hashedNewPassword },
    });

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

    if (!(await this.otpService.isEmailVerified(forgotUserPassDto.email))) {
      throw new BadRequestException('Email has not been verified through OTP!');
    }

    const where: Prisma.UserWhereInput = forgotUserPassDto.email
      ? { email: { equals: forgotUserPassDto.email, mode: 'insensitive' } }
      : { nickname: { equals: forgotUserPassDto.nickname, mode: 'insensitive' } };

    const user = await this.prisma.user.findFirst({ where });
    if (!user) {
      throw new BadRequestException('User not found!');
    }

    const hashedNewPassword = await bcrypt.hash(
      forgotUserPassDto.newPassword,
      10,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNewPassword },
    });

    await this.otpService.removeVerifiedEmail(forgotUserPassDto.email);

    return { message: 'Password successfully changed', status: 200 };
  }

  async updateExcluded(
    email: string,
    updateExcludedDto: UpdateExcludedDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { email },
      data: { excludedMobs: updateExcludedDto.excludedMobs },
    });

    return this.toResponse(user);
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

    const where: Prisma.UserWhereInput = updateUserRoleDto.email
      ? { email: { equals: updateUserRoleDto.email, mode: 'insensitive' } }
      : { nickname: { equals: updateUserRoleDto.nickname, mode: 'insensitive' } };

    const user = await this.prisma.user.findFirst({ where });
    if (!user) {
      throw new BadRequestException('User not found!');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: updateUserRoleDto.role as unknown as Role },
    });

    return { message: 'Role has been updated successfully', status: 200 };
  }

  async deleteOne(identifier: string): Promise<DeleteUserDtoResponse> {
    if (!identifier) {
      throw new BadRequestException(
        'The "identifier" header must be specified',
      );
    }

    await this.prisma.user.deleteMany({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { nickname: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });

    return { message: 'User deleted', status: 200 };
  }

  async deleteAll(): Promise<DeleteAllUsersDtoResponse> {
    await this.prisma.user.deleteMany();
    return { message: 'All users deleted', status: 200 };
  }

  async updateTimezone(email: string, timezone: string): Promise<BotSession> {
    return this.prisma.botSession.upsert({
      where: { email },
      create: { email, timezone },
      update: { timezone },
    });
  }

  async getUsersCount(): Promise<{ count: number }> {
    const count = await this.prisma.user.count();
    return { count };
  }
}
