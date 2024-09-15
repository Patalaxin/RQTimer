import { Body, Controller, Get, Inject, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SignInDtoRequest, SignInDtoResponse } from './dto/signIn.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExchangeRefreshDto } from './dto/exchangeRefresh.dto';
import { GetEmailFromToken } from '../decorators/getEmail.decorator';
import { SignOutsDtoResponse } from './dto/signOut.dto';

import { IAuth } from './auth.interface';

@ApiTags('Auth API')
@Controller('auth')
export class AuthController {
  constructor(@Inject('IAuth') private readonly authInterface: IAuth) {}

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  signIn(
    @Res({ passthrough: true }) res: Response,
    @Body() signInDto: SignInDtoRequest,
  ): Promise<SignInDtoResponse> {
    return this.authInterface.signIn(res, signInDto);
  }

  @ApiOperation({ summary: 'Exchange Refresh Token' })
  @ApiBearerAuth()
  @Post('exchange-refresh')
  exchangeRefresh(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @Body() exchangeRefreshDto: ExchangeRefreshDto,
  ): Promise<SignInDtoResponse> {
    return this.authInterface.exchangeRefresh(
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
    @GetEmailFromToken() email: string,
  ): Promise<SignOutsDtoResponse> {
    return this.authInterface.signOut(res, email);
  }
}
