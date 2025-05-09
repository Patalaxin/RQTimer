import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
// import {
//   NotificationSession,
//   NotificationSessionSchema,
// } from '../schemas/notification.schema';
import {
  Notification1Session,
  Notification1SessionSchema,
} from '../schemas/notification1.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification1Session.name,
        schema: Notification1SessionSchema,
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
