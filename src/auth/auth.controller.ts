import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignInDtoRequest, SignInDtoResponse } from './dto/signIn.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExchangeRefreshDto } from './dto/exchangeRefresh.dto';

@ApiTags('Auth API')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  async signIn(
    @Res({ passthrough: true }) res: Response,
    @Body() signInDto: SignInDtoRequest,
  ): Promise<SignInDtoResponse> {
    const tokens: SignInDtoResponse = await this.authService.signIn(signInDto);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 2678400000, // 2 678 400 000 = 31 day in milliseconds
    });
    return tokens;
  }

  @ApiOperation({ summary: 'Exchange Refresh Token' })
  @ApiBearerAuth()
  @Post('exchangeRefresh')
  exchangeRefresh(
    @Req() req: Request,
    @Body() exchangeRefreshDto: ExchangeRefreshDto,
  ): Promise<SignInDtoResponse> {
    return this.authService.exchangeRefresh(
      exchangeRefreshDto,
      req.cookies['refreshToken'],
    );
  }
}
