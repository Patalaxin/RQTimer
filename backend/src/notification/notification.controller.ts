import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { INotification } from './notification.interface';
import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';
import { TokensGuard } from '../guards/tokens.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesTypes } from '../schemas/user.schema';

@ApiTags('Notification API')
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject('INotification')
    private readonly notificationInterface: INotification,
  ) {}

  @UseGuards(TokensGuard)
  @Roles(RolesTypes.Admin)
  @ApiBearerAuth()
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
