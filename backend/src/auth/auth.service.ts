import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Token, TokenDocument } from '../schemas/refreshToken.schema';
import { SignInDtoRequest, SignInDtoResponse } from './dto/signIn.dto';
import { ExchangeRefreshDto } from './dto/exchangeRefresh.dto';
import { Response } from 'express';
import { AuthGateway } from './auth.gateway';
import { SignOutsDtoResponse } from './dto/signOut.dto';
import { IAuth } from './auth.interface';

@Injectable()
export class AuthService implements IAuth {
  constructor(
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly authGateway: AuthGateway,
  ) {}

  private async addTokens(user: User): Promise<SignInDtoResponse> {
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
    const hashedRefreshToken: string = await bcrypt.hash(refreshToken, 10);
    await this.tokenModel.findOneAndUpdate(
      { email: user.email, nickname: user.nickname },
      {
        $set: {
          refreshToken: hashedRefreshToken,
          expireAt: new Date(Date.now() + 2678400000),
        },
      },
      { upsert: true },
    );
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

    const query = signInDto.email
      ? { email: new RegExp(`^${signInDto.email}$`, 'i') }
      : { nickname: new RegExp(`^${signInDto.nickname}$`, 'i') };

    const user: User = await this.userModel.findOne(query);
    if (!user) {
      throw new BadRequestException('Login or password invalid');
    }

    const isPasswordMatch: boolean = await bcrypt.compare(
      signInDto.password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Login or password invalid');
    }
    const tokens: SignInDtoResponse = await this.addTokens(user);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 2678400000, // 2 678 400 000 =  31 day in milliseconds
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

    let user: User;
    let refreshToken: string;

    try {
      const query = exchangeRefreshDto.email
        ? { email: new RegExp(`^${exchangeRefreshDto.email}$`, 'i') }
        : { nickname: new RegExp(`^${exchangeRefreshDto.nickname}$`, 'i') };
      user = await this.userModel.findOne(query).lean().exec();
      const tokenRecord = await this.tokenModel.findOne(query);

      refreshToken = tokenRecord.refreshToken;
    } catch {
      throw new UnauthorizedException(
        'There is no valid refresh token for this user',
      );
    }

    const isRefreshTokenCorrect: boolean = await bcrypt.compare(
      userRefreshToken,
      refreshToken,
    );

    if (!isRefreshTokenCorrect) {
      throw new UnauthorizedException('Incorrect refresh token');
    }

    const tokens = await this.addTokens(user);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 2678400000, // 2,678,400,000 = 31 day in milliseconds
      sameSite: 'none',
    });

    return tokens;
  }

  async signOut(res: Response, email: string): Promise<SignOutsDtoResponse> {
    await this.tokenModel.findOneAndDelete({ email: email });

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
