import { Injectable } from '@nestjs/common';
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
import { UnauthorizedError, ValidationError } from '../errors/app.error';

const REFRESH_TOKEN_TTL_MS = 31 * 24 * 60 * 60 * 1000;

/**
 * Хэш, с которым сверяется пароль, когда пользователя нет. Нужен только ради
 * постоянного времени ответа — совпасть с ним нельзя, исходная строка нигде не
 * хранится.
 */
const ABSENT_USER_HASH = bcrypt.hashSync(randomUUID(), 10);

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
      throw new ValidationError(
        'AMBIGUOUS_IDENTIFIER',
        'Email and Nickname fields should not be together',
      );
    }

    const where: Prisma.UserWhereInput = signInDto.email
      ? { email: { equals: signInDto.email, mode: 'insensitive' } }
      : { nickname: { equals: signInDto.nickname, mode: 'insensitive' } };

    const user = await this.prisma.user.findFirst({ where });

    // Несуществующий пользователь и неверный пароль обязаны быть неотличимы.
    // Текст совпадал и раньше, а вот коды ответа — нет (400 против 401), и по
    // ним перебирались существующие аккаунты. Сравнение по фиктивному хэшу
    // нужно, чтобы не осталось и разницы во времени ответа: без него ветка
    // «пользователя нет» отвечала заметно быстрее.
    const isPasswordMatch: boolean = await bcrypt.compare(
      signInDto.password,
      user?.passwordHash ?? ABSENT_USER_HASH,
    );

    if (!user || !isPasswordMatch) {
      throw new UnauthorizedError(
        'INVALID_CREDENTIALS',
        'Login or password invalid',
      );
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
      // Статус здесь и ниже остаётся 401 намеренно: интерцептор фронта по 401
      // от exchange-refresh разлогинивает пользователя, и любой другой код
      // оставил бы его с протухшей сессией.
      throw new UnauthorizedError(
        'AMBIGUOUS_IDENTIFIER',
        'Email and Nickname fields should not be together',
      );
    }
    if (!userRefreshToken) {
      throw new UnauthorizedError(
        'REFRESH_TOKEN_MISSING',
        'Refresh token is missing from the request',
      );
    }

    const where: Prisma.UserWhereInput = exchangeRefreshDto.email
      ? { email: { equals: exchangeRefreshDto.email, mode: 'insensitive' } }
      : {
          nickname: {
            equals: exchangeRefreshDto.nickname,
            mode: 'insensitive',
          },
        };

    const user = await this.prisma.user.findFirst({
      where,
      include: { refreshToken: true },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedError(
        'REFRESH_TOKEN_UNKNOWN',
        'There is no valid refresh token for this user',
      );
    }

    const isRefreshTokenCorrect: boolean = await bcrypt.compare(
      userRefreshToken,
      user.refreshToken.tokenHash,
    );

    if (!isRefreshTokenCorrect) {
      throw new UnauthorizedError(
        'REFRESH_TOKEN_INVALID',
        'Incorrect refresh token',
      );
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
