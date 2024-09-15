import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
  providers: [
    HistoryService,
    { provide: 'IHistory', useClass: HistoryService },
  ],
  exports: [HistoryService],
  imports: [
    MongooseModule.forFeature([
      { name: GranasHistory.name, schema: GranasHistorySchema },
    ]),
    MongooseModule.forFeature([
      { name: EnigmaHistory.name, schema: EnigmaHistorySchema },
    ]),
    MongooseModule.forFeature([
      { name: LogrusHistory.name, schema: LogrusHistorySchema },
    ]),
  ],
  controllers: [HistoryController],
})
export class HistoryModule {}
