import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { HistoryModule } from '../history/history.module';
import { BotModule } from '../telegramBot/bot.module';
import { MobService } from './mob.service';
import { MobController } from './mob.controller';
import { Mob, MobSchema } from '../schemas/mob.schema';
import { MobsData, MobsDataSchema } from '../schemas/mobsData.schema';

@Module({
  providers: [MobService, { provide: 'IMob', useExisting: MobService }],
  exports: [MobService],
  imports: [
    UsersModule,
    HistoryModule,
    BotModule,
    MongooseModule.forFeature([{ name: Mob.name, schema: MobSchema }]),
    MongooseModule.forFeature([
      { name: MobsData.name, schema: MobsDataSchema },
    ]),
  ],
  controllers: [MobController],
})
export class MobModule {}
