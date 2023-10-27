import { IsEmail, IsNotEmpty } from 'class-validator';

export class ExchangeRefreshDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
