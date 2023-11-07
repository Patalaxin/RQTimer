import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ElitesService } from './elites.service';
import { UsersModule } from '../users/users.module';
import { ElitesController } from './elites.controller';
import { GranasElite, GranasEliteSchema } from '../schemas/granasElites.schema';
import { EnigmaElite, EnigmaEliteSchema } from '../schemas/enigmaElites.schema';
import { LogrusElite, LogrusEliteSchema } from '../schemas/logrusElites.schema';
import { Token, TokenSchema } from '../schemas/refreshToken.schema';
import { User, UserSchema } from '../schemas/user.schema';
import {
  GranasHistory,
  GranasHistorySchema,
} from '../schemas/granasHistory.schema';
import {
  EnigmaHistory,
  EnigmaHistorySchema,
} from '../schemas/enigmaHistory.schema';
import {
  LogrusHistory,
  LogrusHistorySchema,
} from '../schemas/logrusHistory.schema';
import { HistoryModule } from '../history/history.module';
import { BotModule } from "../telegramBot/bot.module";

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
    MongooseModule.forFeature([
      { name: GranasHistory.name, schema: GranasHistorySchema },
    ]),
    MongooseModule.forFeature([
      { name: EnigmaHistory.name, schema: EnigmaHistorySchema },
    ]),
    MongooseModule.forFeature([
      { name: LogrusHistory.name, schema: LogrusHistorySchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  controllers: [ElitesController],
})
export class ElitesModule {}
