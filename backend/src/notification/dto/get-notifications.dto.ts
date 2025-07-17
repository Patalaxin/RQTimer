import { ApiProperty } from '@nestjs/swagger';
import { LanguageEnum } from '../../schemas/language.enum';

export class GetNotificationsDtoResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({
    example: {
      ru: 'Текст',
      en: 'Text',
    },
  })
  text: Record<LanguageEnum, string>;
}
