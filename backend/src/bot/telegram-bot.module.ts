import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BotSession, BotSessionSchema } from '../schemas/telegram-bot.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Mob, MobSchema } from '../schemas/mob.schema'; // Импорт схемы для Mob
import { TelegramBotService } from './telegram-bot.service';
import { MobModule } from '../mob/mob.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BotSession.name, schema: BotSessionSchema },
      { name: User.name, schema: UserSchema },
      { name: Mob.name, schema: MobSchema },
    ]),
    MobModule,
  ],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
