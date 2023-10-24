import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @ValidateIf((object) => !object.nickname || object.email)
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  @ValidateIf((object) => !object.email || object.nickname)
  nickname: string;
}
