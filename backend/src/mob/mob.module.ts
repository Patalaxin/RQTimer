import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { HistoryModule } from '../history/history.module';
import { MobService } from './mob.service';
import { MobController } from './mob.controller';
import { MobGateway } from './mob.gateway';
import { UnixtimeModule } from '../unixtime/unixtime.module';
import { GroupModule } from '../group/group.module';
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
