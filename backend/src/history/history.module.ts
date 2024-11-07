import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HeliosHistory,
  HeliosHistorySchema,
} from '../schemas/heliosHistory.schema';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import {
  IgnisHistory,
  IgnisHistorySchema,
} from '../schemas/ignisHistory.schema';

@Module({
  providers: [
    HistoryService,
    { provide: 'IHistory', useClass: HistoryService },
  ],
  exports: [HistoryService],
  imports: [
    MongooseModule.forFeature([
      { name: HeliosHistory.name, schema: HeliosHistorySchema },
      { name: IgnisHistory.name, schema: IgnisHistorySchema },
    ]),
  ],
  controllers: [HistoryController],
})
export class HistoryModule {}
