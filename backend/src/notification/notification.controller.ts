import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { INotification } from './notification.interface';
import { GetNotificationsDtoResponse } from './dto/get-notifications.dto';
import { TokensGuard } from '../guards/tokens.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesTypes } from '../schemas/user.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('Notifications API')
@Controller('notifications')
@UseInterceptors(ClassSerializerInterceptor)
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
  async create(
    @Body() dto: CreateNotificationDto,
  ): Promise<{ status: string }> {
    await this.notificationInterface.createNotification(dto);
    return { status: 'ok' };
  }

  @Get()
  async findAll(): Promise<GetNotificationsDtoResponse[]> {
    return this.notificationInterface.getNotifications();
  }
}
