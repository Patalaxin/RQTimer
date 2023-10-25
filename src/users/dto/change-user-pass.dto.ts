import {
  IsEmail,
  IsNotEmpty,
  IsString
} from "class-validator";

export class ChangeUserPassDto {

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;

}
