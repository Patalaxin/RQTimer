import {IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum} from "class-validator";
import {BossTypes, Locations, Servers} from "../../schemas/bosses.enum";

export class CreateBossDto {
    @IsEnum(BossTypes)
    @IsNotEmpty()
    bossName: BossTypes;

    @IsString()
    @IsOptional()
    respawnText: string;

    @IsEnum(Locations)
    @IsNotEmpty()
    location: Locations

    @IsNumber()
    @IsNotEmpty()
    willResurrect: number

    @IsNumber()
    @IsOptional()
    cooldown: number

    @IsString()
    @IsNotEmpty()
    image: string

    @IsNumber()
    @IsOptional()
    cooldownTime: number

    @IsEnum(Servers)
    @IsNotEmpty()
    server: Servers
}