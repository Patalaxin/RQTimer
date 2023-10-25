import {
  IsEmail,
  IsNotEmpty,
  IsString
} from "class-validator";

export class ForgotUserPassDto {

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

}
