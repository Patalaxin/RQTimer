import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { HistoryModule } from '../history/history.module';
import { MobService } from './mob.service';
import { MobController } from './mob.controller';
import { Mob, MobSchema } from '../schemas/mob.schema';
import { MobsData, MobsDataSchema } from '../schemas/mobsData.schema';
import { MobGateway } from './mob.gateway';
import { UnixtimeModule } from '../unixtime/unixtime.module';

@Module({
  providers: [
    MobGateway,
    MobService,
    { provide: 'IMob', useClass: MobService },
  ],
  exports: [MobService],
  imports: [
    UsersModule,
    HistoryModule,
    UnixtimeModule,
    MongooseModule.forFeature([
      { name: Mob.name, schema: MobSchema },
      { name: MobsData.name, schema: MobsDataSchema },
    ]),
  ],
  controllers: [MobController],
})
export class MobModule {}
