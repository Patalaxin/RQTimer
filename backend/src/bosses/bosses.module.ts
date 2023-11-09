import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BossesService } from './bosses.service';
import { UsersModule } from '../users/users.module';
import { HistoryModule } from '../history/history.module';
import { BotModule } from '../telegramBot/bot.module';
import { BossesController } from './bosses.controller';
import { GranasBoss, GranasBossSchema } from '../schemas/granasBosses.schema';
import { EnigmaBoss, EnigmaBossSchema } from '../schemas/enigmaBosses.schema';
import { LogrusBoss, LogrusBossSchema } from '../schemas/logrusBosses.schema';

@Module({
  providers: [BossesService],
  exports: [BossesService],
  imports: [
    UsersModule,
    HistoryModule,
    BotModule,
    MongooseModule.forFeature([
      { name: GranasBoss.name, schema: GranasBossSchema },
    ]),
    MongooseModule.forFeature([
      { name: EnigmaBoss.name, schema: EnigmaBossSchema },
    ]),
    MongooseModule.forFeature([
      { name: LogrusBoss.name, schema: LogrusBossSchema },
    ]),
  ],
  controllers: [BossesController],
})
export class BossesModule {}
