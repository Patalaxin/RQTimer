import { SignInDtoRequest, SignInDtoResponse } from './dto/signIn.dto';
import { Response } from 'express';
import { ExchangeRefreshDto } from './dto/exchangeRefresh.dto';
import { SignOutsDtoResponse } from './dto/signOut.dto';

export interface IAuth {
  signIn(
    res: Response,
    signInDto: SignInDtoRequest,
  ): Promise<SignInDtoResponse>;

  exchangeRefresh(
    res: Response,
    exchangeRefreshDto: ExchangeRefreshDto,
    userRefreshToken: string,
  ): Promise<SignInDtoResponse>;

  signOut(res: Response, email: string): Promise<SignOutsDtoResponse>;
}
