import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import {
  NotificationSession,
  NotificationSessionSchema,
} from '../schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: NotificationSession.name,
        schema: NotificationSessionSchema,
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    { provide: 'INotification', useClass: NotificationService },
  ],
})
export class NotificationModule {}
