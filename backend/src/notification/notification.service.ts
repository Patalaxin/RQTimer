import { Injectable } from '@nestjs/common';
import {
  NotificationDocument,
  NotificationSession,
} from '../schemas/notification.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { INotification } from './notification.interface';
import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';

@Injectable()
export class NotificationService implements INotification {
  constructor(
    @InjectModel(NotificationSession.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(text: string): Promise<void> {
    await this.notificationModel.create({ text });
  }

  async getNotifications(): Promise<GetNotificationsDtoResponse[]> {
    const notifications = await this.notificationModel
      .find()
      .sort({ expireAt: -1 })
      .exec();

    return notifications.map((notification) => ({
      id: notification._id,
      text: notification.text,
    }));
  }
}
