import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BotSession, BotSessionSchema } from '../schemas/telegram-bot.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BotSession.name, schema: BotSessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
