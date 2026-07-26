import { Module, forwardRef } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { UsersModule } from '../users/users.module';
import { MobModule } from '../mob/mob.module';

@Module({
  imports: [UsersModule, forwardRef(() => MobModule)],
  controllers: [GroupController],
  providers: [GroupService, { provide: 'IGroup', useClass: GroupService }],
  exports: [GroupService],
})
export class GroupModule {}
