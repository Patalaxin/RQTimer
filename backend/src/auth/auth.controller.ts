import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SignInDtoRequest, SignInDtoResponse } from './dto/signIn.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExchangeRefreshDto } from './dto/exchangeRefresh.dto';
import { GetUser } from '../decorators/get-user.decorator';
import { SignOutsDtoResponse } from './dto/signOut.dto';
import { TokensGuard } from '../guards/tokens.guard';
import { Public } from '../decorators/public.decorator';
import { AuthService } from './auth.service';

@ApiTags('Auth API')
@UseGuards(TokensGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Вход: токен здесь как раз и выдаётся.
  @Public()
  @ApiOperation({ summary: 'Login' })
  @Post('login')
  signIn(
    @Res({ passthrough: true }) res: Response,
    @Body() signInDto: SignInDtoRequest,
  ): Promise<SignInDtoResponse> {
    return this.authService.signIn(res, signInDto);
  }

  // Обмен refresh-токена: сюда приходят как раз с протухшим access-токеном.
  @Public()
  @ApiOperation({ summary: 'Exchange Refresh Token' })
  @ApiBearerAuth()
  @Post('exchange-refresh')
  exchangeRefresh(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @Body() exchangeRefreshDto: ExchangeRefreshDto,
  ): Promise<SignInDtoResponse> {
    return this.authService.exchangeRefresh(
      res,
      exchangeRefreshDto,
      req.cookies['refreshToken'],
    );
  }

  @ApiOperation({ summary: 'Sign Out' })
  @ApiBearerAuth()
  @Get('signout')
  signOut(
    @Res({ passthrough: true }) res: Response,
    @GetUser('email') email: string,
  ): Promise<SignOutsDtoResponse> {
    return this.authService.signOut(res, email);
  }
}
