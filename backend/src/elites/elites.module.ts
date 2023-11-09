import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ElitesService } from './elites.service';
import { UsersModule } from '../users/users.module';
import { HistoryModule } from '../history/history.module';
import { BotModule } from '../telegramBot/bot.module';
import { ElitesController } from './elites.controller';
import { GranasElite, GranasEliteSchema } from '../schemas/granasElites.schema';
import { EnigmaElite, EnigmaEliteSchema } from '../schemas/enigmaElites.schema';
import { LogrusElite, LogrusEliteSchema } from '../schemas/logrusElites.schema';

@Module({
  providers: [ElitesService],
  exports: [ElitesService],
  imports: [
    UsersModule,
    HistoryModule,
    BotModule,
    MongooseModule.forFeature([
      { name: GranasElite.name, schema: GranasEliteSchema },
    ]),
    MongooseModule.forFeature([
      { name: EnigmaElite.name, schema: EnigmaEliteSchema },
    ]),
    MongooseModule.forFeature([
      { name: LogrusElite.name, schema: LogrusEliteSchema },
    ]),
  ],
  controllers: [ElitesController],
})
export class ElitesModule {}
