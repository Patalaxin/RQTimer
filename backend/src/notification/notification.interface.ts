import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

export interface INotification {
  createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<void>;

  getNotifications(): Promise<GetNotificationsDtoResponse[]>;
}
