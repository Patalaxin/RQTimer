import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { HistoryModule } from '../history/history.module';
import { UnixtimeModule } from '../unixtime/unixtime.module';
import { GroupModule } from '../group/group.module';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../guards/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { ChestData, ChestDataSchema } from '../schemas/chest.schema';
import { ChestService } from './chest.service';
import { ChestController } from './chest.controller';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => GroupModule),
    HistoryModule,
    UnixtimeModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: ChestData.name, schema: ChestDataSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ChestService, RolesGuard],
  exports: [ChestService],
  controllers: [ChestController],
})
export class ChestModule {}
