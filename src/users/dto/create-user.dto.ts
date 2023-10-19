import {IsEmail, IsNotEmpty, IsString, IsOptional, IsArray, IsEnum, ArrayUnique} from "class-validator";
import {BossTypes, EliteTypes} from "../../schemas/bosses.enum";

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    nickname: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    refreshToken: string

    @IsArray()
    @ArrayUnique()
    @IsEnum(BossTypes, { each: true })
    unavailableBosses: BossTypes[]

    @IsArray()
    @ArrayUnique()
    @IsEnum(EliteTypes, { each: true })
    unavailableElites: EliteTypes[]

    @IsArray()
    @ArrayUnique()
    @IsEnum(BossTypes, { each: true })
    excludedBosses: BossTypes[]

    @IsArray()
    @ArrayUnique()
    @IsEnum(EliteTypes, { each: true })
    excludedElites: EliteTypes[]
}