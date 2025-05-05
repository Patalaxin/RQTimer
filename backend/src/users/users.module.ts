import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { Token, TokenSchema } from '../schemas/refreshToken.schema';
import { OtpModule } from '../OTP/otp.module';
import { BotSession, BotSessionSchema } from '../schemas/telegram-bot.schema';

@Module({
  providers: [UsersService, { provide: 'IUser', useClass: UsersService }],
  exports: [UsersService, MongooseModule],
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    MongooseModule.forFeature([
      { name: BotSession.name, schema: BotSessionSchema },
    ]),
    forwardRef(() => OtpModule),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
