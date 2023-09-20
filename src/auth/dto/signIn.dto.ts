import {IsEmail, IsNotEmpty, IsString} from 'class-validator';

export class SignInDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}
