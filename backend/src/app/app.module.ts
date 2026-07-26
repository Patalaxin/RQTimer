import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MobModule } from '../mob/mob.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { UnixtimeModule } from '../unixtime/unixtime.module';
import { GroupModule } from '../group/group.module';
import * as process from 'process';
import { TelegramBotModule } from '../bot/telegram-bot.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { NotificationModule } from '../notification/notification.module';
import { validate } from '../config/env.validation';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { CleanupModule } from '../cleanup/cleanup.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, validate }),
    PrismaModule,
    CleanupModule,
    AuthModule,
    UsersModule,
    MobModule,
    GroupModule,
    ConfigurationModule,
    UnixtimeModule,
    NotificationModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
      serveRoot: '/static',
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        token: process.env.TELEGRAM_BOT_TOKEN,
      }),
    }),
    TelegramBotModule,
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
