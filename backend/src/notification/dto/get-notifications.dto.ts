import { IsNotEmpty, IsString } from 'class-validator';

export class GetNotificationsDtoResponse {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
