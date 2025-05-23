import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { HistoryModule } from '../history/history.module';
import { MobService } from './mob.service';
import { MobController } from './mob.controller';
import { Mob, MobSchema } from '../schemas/mob.schema';
import { MobsData, MobsDataSchema } from '../schemas/mobsData.schema';
import { MobGateway } from './mob.gateway';
import { UnixtimeModule } from '../unixtime/unixtime.module';
import { GroupModule } from '../group/group.module';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { TelegramBotModule } from '../bot/telegram-bot.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => GroupModule),
    HistoryModule,
    UnixtimeModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: Mob.name, schema: MobSchema },
      { name: MobsData.name, schema: MobsDataSchema },
      { name: User.name, schema: UserSchema },
    ]),
    TelegramBotModule,
  ],
  providers: [
    MobGateway,
    MobService,
    RolesGuard,
    { provide: 'IMob', useClass: MobService },
  ],
  exports: [MobService],
  controllers: [MobController],
})
export class MobModule {}
