import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BossesService } from './bosses.service';
import { UsersModule } from '../users/users.module';
import { BossesController } from './bosses.controller';
import { GranasBoss, GranasBossSchema } from '../schemas/granasBosses.schema';
import { EnigmaBoss, EnigmaBossSchema } from '../schemas/enigmaBosses.schema';
import { LogrusBoss, LogrusBossSchema } from '../schemas/logrusBosses.schema';
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
  providers: [BossesService],
  exports: [BossesService],
  imports: [
    UsersModule,
    BotModule,
    HistoryModule,
    MongooseModule.forFeature([
      { name: GranasBoss.name, schema: GranasBossSchema },
    ]),
    MongooseModule.forFeature([
      { name: EnigmaBoss.name, schema: EnigmaBossSchema },
    ]),
    MongooseModule.forFeature([
      { name: LogrusBoss.name, schema: LogrusBossSchema },
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
  controllers: [BossesController],
})
export class BossesModule {}
