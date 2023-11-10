import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { SessionId, SessionIdSchema } from '../schemas/sessionID.schema';

@Module({
  providers: [UsersService, { provide: 'IUser', useExisting: UsersService }],
  exports: [UsersService],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: SessionId.name, schema: SessionIdSchema },
    ]),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
