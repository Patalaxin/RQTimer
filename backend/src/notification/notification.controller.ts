import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { INotification } from './notification.interface';
import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';

@ApiTags('Notification API')
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject('INotification')
    private readonly notificationInterface: INotification,
  ) {}

  @Post()
  @ApiResponse({
    status: 200,
    description: 'Notification successfully created',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  async create(@Body('text') text: string) {
    await this.notificationInterface.createNotification(text);
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<GetNotificationsDtoResponse[]> {
    return this.notificationInterface.getNotifications();
  }
}
