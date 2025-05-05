import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';

export interface INotification {
  createNotification(text: string): Promise<void>;

  getNotifications(): Promise<GetNotificationsDtoResponse[]>;
}
