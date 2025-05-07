import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { Group, GroupSchema } from '../schemas/group.schema';
import { UsersModule } from '../users/users.module';
import { MobModule } from '../mob/mob.module';
import { BotSession, BotSessionSchema } from '../schemas/telegram-bot.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: BotSession.name, schema: BotSessionSchema },
    ]),
    UsersModule,
    forwardRef(() => MobModule),
  ],
  controllers: [GroupController],
  providers: [GroupService, { provide: 'IGroup', useClass: GroupService }],
  exports: [GroupService],
})
export class GroupModule {}
