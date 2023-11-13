import { Module } from '@nestjs/common';
import { TelegramBotService } from './bot.service';

@Module({
  providers: [TelegramBotService],
  exports: [TelegramBotService],
  imports: [],
  controllers: [],
})
export class BotModule {}
