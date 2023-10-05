import {IsNotEmpty, IsString, IsOptional, IsNumber} from "class-validator";
import {BossTypes, Servers} from "../../schemas/bosses.enum";

export class CreateBossDto {
    @IsString()
    @IsNotEmpty()
    bossName: BossTypes;

    @IsString()
    @IsOptional()
    respawnText: string;

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