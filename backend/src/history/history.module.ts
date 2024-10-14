import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HeliosHistory,
  HeliosHistorySchema,
} from '../schemas/heliosHistory.schema';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  providers: [HistoryService],
  exports: [HistoryService],
  imports: [
    MongooseModule.forFeature([
      { name: HeliosHistory.name, schema: HeliosHistorySchema },
    ]),
  ],
  controllers: [HistoryController],
})
export class HistoryModule {}
