import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignInDtoRequest {
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nickname?: string;
}

export class SignInDtoResponse {
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
