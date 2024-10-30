import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExchangeRefreshDto {
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nickname?: string;
}
