import { Injectable } from '@nestjs/common';
import {
  NotificationDocument,
  NotificationSession,
} from '../schemas/notification.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';
import { INotification } from './notification.interface';

@Injectable()
export class NotificationService implements INotification {
  constructor(
    @InjectModel(NotificationSession.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<void> {
    await this.notificationModel.create({ text: dto });
  }

  async getNotifications(): Promise<GetNotificationsDtoResponse[]> {
    const notifications = await this.notificationModel
      .find({}, { 'text._id': 0 })
      .sort({ expireAt: -1 })
      .lean()
      .exec();
    return notifications.map((notification) => ({
      id: notification._id,
      text: notification.text,
    }));
  }
}
