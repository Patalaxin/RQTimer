import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
} from 'class-validator';
import { IsNickname } from '../../decorators/isNickname.decorator';

export class UpdateUnavailableDto {
  @IsArray()
  @IsMongoId({ each: true })
  unavailableMobs: string[];

  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @IsNickname()
  @IsOptional()
  nickname?: string;
}
