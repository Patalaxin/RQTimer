import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    { provide: 'INotification', useClass: NotificationService },
  ],
})
export class NotificationModule {}
