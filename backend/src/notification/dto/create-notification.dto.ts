import { IsString, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LanguageEnum } from '../../schemas/language.enum';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  [LanguageEnum.Русский]: string;

  @ApiProperty()
  @IsString()
  @IsDefined()
  [LanguageEnum.English]: string;
}
