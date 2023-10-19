import {IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum} from "class-validator";
import {BossTypes, Locations} from "../../schemas/bosses.enum";

export class UpdateBossDto {

    @IsEnum(BossTypes)
    @IsOptional()
    bossName: BossTypes;

    @IsString()
    @IsOptional()
    respawnText: string;

    @IsEnum(Locations)
    @IsOptional()
    location: Locations

    @IsNumber()
    @IsOptional()
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
}