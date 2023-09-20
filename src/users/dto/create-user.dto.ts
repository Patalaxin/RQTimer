import {IsInt, IsNotEmpty, IsString} from "class-validator";

export class CreateUserDto {
    @IsInt()
    @IsNotEmpty()
    email: number;

    @IsString()
    @IsNotEmpty()
    password: string;
}