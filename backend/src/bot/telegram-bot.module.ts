import { forwardRef, Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { MobModule } from '../mob/mob.module';

@Module({
  imports: [forwardRef(() => MobModule)],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
