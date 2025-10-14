import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HeliosHistory,
  HeliosHistorySchema,
} from '../schemas/heliosHistory.schema';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

import { Mob, MobSchema } from '../schemas/mob.schema';
import {
  FenixHistory,
  FenixHistorySchema,
} from '../schemas/fenixHistory.schema';
import {
  SolusHistory,
  SolusHistorySchema,
} from '../schemas/solusHistory.schema';

@Module({
  providers: [
    HistoryService,
    { provide: 'IHistory', useClass: HistoryService },
  ],
  exports: [HistoryService],
  imports: [
    MongooseModule.forFeature([
      { name: HeliosHistory.name, schema: HeliosHistorySchema },
      { name: FenixHistory.name, schema: FenixHistorySchema },
      { name: SolusHistory.name, schema: SolusHistorySchema },
      { name: Mob.name, schema: MobSchema },
    ]),
  ],
  controllers: [HistoryController],
})
export class HistoryModule {}
