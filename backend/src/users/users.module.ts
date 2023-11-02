import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { Token, TokenSchema } from '../schemas/refreshToken.schema';
import { SessionId, SessionIdSchema } from '../schemas/sessionID.schema';

@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    MongooseModule.forFeature([
      { name: SessionId.name, schema: SessionIdSchema },
    ]),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
