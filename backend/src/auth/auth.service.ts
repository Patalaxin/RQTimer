import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { SignInDtoRequest, SignInDtoResponse } from './dto/signIn.dto';
import { ExchangeRefreshDto } from './dto/exchangeRefresh.dto';
import { AuthGateway } from './auth.gateway';
import { SignOutsDtoResponse } from './dto/signOut.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const REFRESH_TOKEN_TTL_MS = 31 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authGateway: AuthGateway,
  ) {}

  private async addTokens(user: {
    id: string;
    email: string;
    nickname: string;
    role: string;
    groupName: string | null;
    isGroupLeader: boolean;
  }): Promise<SignInDtoResponse> {
    const payload = {
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      groupName: user.groupName,
      isGroupLeader: user.isGroupLeader,
    };

    const accessToken: string = await this.jwtService.signAsync(payload, {
      secret: process.env.SECRET_CONSTANT,
    });
    const refreshToken: string = randomUUID();
    const tokenHash: string = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
      update: {
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    const client = this.authGateway.getClientByEmail(user.email);
    if (client) {
      this.authGateway.sendUserStatusUpdate(client, user.email, 'online');
    }

    return { accessToken, refreshToken };
  }

  async signIn(
    res: Response,
    signInDto: SignInDtoRequest,
  ): Promise<SignInDtoResponse> {
    if (signInDto.email && signInDto.nickname) {
      throw new BadRequestException(
        'Email and Nickname fields should not be together',
      );
    }

    const where: Prisma.UserWhereInput = signInDto.email
      ? { email: { equals: signInDto.email, mode: 'insensitive' } }
      : { nickname: { equals: signInDto.nickname, mode: 'insensitive' } };

    const user = await this.prisma.user.findFirst({ where });
    if (!user) {
      throw new BadRequestException('Login or password invalid');
    }

    const isPasswordMatch: boolean = await bcrypt.compare(
      signInDto.password,
      user.passwordHash,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Login or password invalid');
    }
    const tokens: SignInDtoResponse = await this.addTokens(user);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: REFRESH_TOKEN_TTL_MS,
      sameSite: 'none',
    });

    return tokens;
  }

  async exchangeRefresh(
    res: Response,
    exchangeRefreshDto: ExchangeRefreshDto,
    userRefreshToken: string,
  ): Promise<SignInDtoResponse> {
    if (exchangeRefreshDto.email && exchangeRefreshDto.nickname) {
      throw new UnauthorizedException(
        'Email and Nickname fields should not be together',
      );
    }
    if (!userRefreshToken) {
      throw new UnauthorizedException(
        'Refresh token is missing from the request',
      );
    }

    const where: Prisma.UserWhereInput = exchangeRefreshDto.email
      ? { email: { equals: exchangeRefreshDto.email, mode: 'insensitive' } }
      : { nickname: { equals: exchangeRefreshDto.nickname, mode: 'insensitive' } };

    const user = await this.prisma.user.findFirst({
      where,
      include: { refreshToken: true },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(
        'There is no valid refresh token for this user',
      );
    }

    const isRefreshTokenCorrect: boolean = await bcrypt.compare(
      userRefreshToken,
      user.refreshToken.tokenHash,
    );

    if (!isRefreshTokenCorrect) {
      throw new UnauthorizedException('Incorrect refresh token');
    }

    const tokens = await this.addTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: REFRESH_TOKEN_TTL_MS,
      sameSite: 'none',
    });

    return tokens;
  }

  async signOut(res: Response, email: string): Promise<SignOutsDtoResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    }

    const client = this.authGateway.getClientByEmail(email);
    if (client) {
      this.authGateway.sendUserStatusUpdate(client, email, 'offline');
    }

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: true,
      maxAge: 0,
      sameSite: 'none',
    });

    return { message: 'Successfully logged out', status: 200 };
  }
}
