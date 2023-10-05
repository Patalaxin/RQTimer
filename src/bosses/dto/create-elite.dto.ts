import {IsNotEmpty, IsString, IsOptional, IsNumber} from "class-validator";
import {EliteTypes, Servers} from "../../schemas/bosses.enum";

export class CreateEliteDto {
    @IsString()
    @IsNotEmpty()
    bossName: EliteTypes;

    @IsString()
    @IsNotEmpty()
    location: string

    @IsNumber()
    @IsNotEmpty()
    willResurrect: number

    @IsNumber()
    @IsNotEmpty()
    cooldown: number

    @IsString()
    @IsNotEmpty()
    image: string

    @IsNumber()
    @IsOptional()
    cooldownTime: number

    @IsString()
    @IsNotEmpty()
    server: Servers
}