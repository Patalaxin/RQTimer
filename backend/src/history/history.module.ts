import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
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
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  providers: [HistoryService],
  exports: [HistoryService],
  imports: [
    UsersModule,
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
  controllers: [HistoryController],
})
export class HistoryModule {}
