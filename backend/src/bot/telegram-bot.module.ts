import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BotSession, BotSessionSchema } from '../schemas/telegram-bot.schema';
import { Mob, MobSchema } from '../schemas/mob.schema';
import { TelegramBotService } from './telegram-bot.service';
import { MobModule } from '../mob/mob.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BotSession.name, schema: BotSessionSchema },
      { name: Mob.name, schema: MobSchema },
    ]),
    forwardRef(() => MobModule),
  ],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
