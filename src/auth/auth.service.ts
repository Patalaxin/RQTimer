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
import { jwtConstants } from './constants';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../schemas/user.schema';
import { Token, TokenDocument } from '../schemas/refreshToken.schema';
import { SignInDtoRequest, SignInDtoResponse } from './dto/signIn.dto';
import { ExchangeRefreshDto } from './dto/exchangeRefresh.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private async addTokens(user: User): Promise<SignInDtoResponse> {
    const payload = { email: user.email, nickname: user.nickname };
    const accessToken: string = await this.jwtService.signAsync(payload, {
      secret: jwtConstants.secret,
    });
    const refreshToken: string = randomUUID();
    const hashedRefreshToken: string = await bcrypt.hash(refreshToken, 10);
    await this.tokenModel.findOneAndUpdate(
      { email: user.email },
      { refreshToken: hashedRefreshToken },
      {
        new: true,
        upsert: true,
      },
    );
    return { accessToken, refreshToken };
  }

  async signIn(signInDto: SignInDtoRequest): Promise<SignInDtoResponse> {
    if (signInDto.email && signInDto.nickname) {
      throw new BadRequestException(
        'Email and Nickname fields should not be together',
      );
    }

    let user: User;
    try {
      if (signInDto.email) {
        user = await this.userModel.findOne({ email: signInDto.email });
        if (!user) {
          throw new BadRequestException('Login or password invalid');
        }
      } else if (signInDto.nickname) {
        user = await this.userModel.findOne({ nickname: signInDto.nickname });
        if (!user) {
          throw new BadRequestException('Login or password invalid');
        }
      } else {
        throw new BadRequestException('Something went wrong');
      }
    } catch (err) {
      throw err;
    }

    const isPasswordMatch = await bcrypt.compare(
      signInDto.password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Login or password invalid');
    }
    return this.addTokens(user);
  }

  async exchangeRefresh(
    exchangeRefreshDto: ExchangeRefreshDto,
    userRefreshToken: string,
  ): Promise<SignInDtoResponse> {
    const user: User = await this.usersService.findUser(
      exchangeRefreshDto.email,
    );
    const { refreshToken } = await this.tokenModel.findOne({
      email: exchangeRefreshDto.email,
    });

    const isRefreshTokenCorrect: boolean = await bcrypt.compare(
      userRefreshToken,
      refreshToken,
    );
    if (!isRefreshTokenCorrect) {
      throw new UnauthorizedException('Incorrect refresh token');
    }
    return this.addTokens(user);
  }
}
