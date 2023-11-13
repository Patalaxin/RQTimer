import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { SessionId, SessionIdSchema } from '../schemas/sessionID.schema';
import { Token, TokenSchema } from '../schemas/refreshToken.schema';

@Module({
  providers: [UsersService, { provide: 'IUser', useClass: UsersService }],
  exports: [UsersService],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: SessionId.name, schema: SessionIdSchema },
    ]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
