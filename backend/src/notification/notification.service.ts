import { Injectable } from '@nestjs/common';
import {
  Notification1Document,
  Notification1Session,
} from '../schemas/notification1.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';
import { INotification } from './notification.interface';

@Injectable()
export class NotificationService implements INotification {
  constructor(
    @InjectModel(Notification1Session.name)
    private readonly notificationModel: Model<Notification1Document>,
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
