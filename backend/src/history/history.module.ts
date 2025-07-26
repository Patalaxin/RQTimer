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
import {
  AstusHistory,
  AstusHistorySchema,
} from '../schemas/astusHistory.schema';
import {
  PyrosHistory,
  PyrosHistorySchema,
} from '../schemas/pyrosHistory.schema';
import {
  AztecHistory,
  AztecHistorySchema,
} from '../schemas/aztecHistory.schema';
import {
  OrtosHistory,
  OrtosHistorySchema,
} from '../schemas/ortosHistory.schema';
import { Mob, MobSchema } from '../schemas/mob.schema';

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
      { name: AstusHistory.name, schema: AstusHistorySchema },
      { name: PyrosHistory.name, schema: PyrosHistorySchema },
      { name: AztecHistory.name, schema: AztecHistorySchema },
      { name: OrtosHistory.name, schema: OrtosHistorySchema },
      { name: Mob.name, schema: MobSchema },
    ]),
  ],
  controllers: [HistoryController],
})
export class HistoryModule {}
