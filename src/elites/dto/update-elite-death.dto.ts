import { IsEnum, IsNotEmpty, IsNumber, IsOptional, ValidateIf } from "class-validator";
import { EliteTypes, Servers } from "../../schemas/bosses.enum";

export class UpdateEliteDeathDto {
  @IsEnum(EliteTypes)
  @IsNotEmpty()
  eliteName: EliteTypes;

  @IsEnum(Servers)
  @IsNotEmpty()
  server: Servers;

  @IsNumber()
  @IsOptional()
  @ValidateIf((object) => !object.dateOfRespawn || object.dateOfDeath)
  dateOfDeath?: number

  @IsNumber()
  @IsOptional()
  @ValidateIf((object) => !object.dateOfDeath || object.dateOfRespawn)
  dateOfRespawn?: number
}
