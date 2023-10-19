import {IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum} from "class-validator";
import {EliteTypes, Locations} from "../../schemas/bosses.enum";

export class UpdateEliteDto {

    @IsEnum(EliteTypes)
    @IsNotEmpty()
    eliteName: EliteTypes;

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
    @IsOptional()
    image: string

    @IsNumber()
    @IsOptional()
    cooldownTime: number

}