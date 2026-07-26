import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramConnectionService } from './telegram-connection.service';
import { MobModule } from '../mob/mob.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('TELEGRAM_BOT_TOKEN'),
        // Автозапуск выключен намеренно: nestjs-telegraf вызывает launch() без
        // await и без catch, из-за чего недоступный Telegram роняет процесс.
        // Подключением управляет TelegramConnectionService.
        launchOptions: false,
      }),
    }),
    forwardRef(() => MobModule),
  ],
  providers: [TelegramConnectionService, TelegramBotService],
  exports: [TelegramConnectionService, TelegramBotService],
})
export class TelegramBotModule {}
