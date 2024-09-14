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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
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

    console.log(payload);
    const accessToken: string = await this.jwtService.signAsync(payload, {
      secret: process.env.SECRET_CONSTANT,
    });
    const refreshToken: string = randomUUID();
    const hashedRefreshToken: string = await bcrypt.hash(refreshToken, 10);
    await this.tokenModel.findOneAndUpdate(
      { email: user.email },
      { refreshToken: hashedRefreshToken, nickname: user.nickname },
      {
        new: true,
        upsert: true,
      },
    );

    this.authGateway.sendUserStatusUpdate(user.email, 'online');
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
      ? { email: signInDto.email }
      : { nickname: signInDto.nickname };

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
      throw new BadRequestException(
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
        ? { email: exchangeRefreshDto.email }
        : { nickname: exchangeRefreshDto.nickname };
      user = await this.userModel.findOne(query).lean().exec();
      const tokenRecord = await this.tokenModel.findOne(query);

      refreshToken = tokenRecord.refreshToken;
    } catch (err) {
      throw new BadRequestException(
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
    this.authGateway.sendUserStatusUpdate(email, 'offline');

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: true,
      maxAge: 0,
      sameSite: 'none',
    });

    return { message: 'Successfully logged out', status: 200 };
  }
}
