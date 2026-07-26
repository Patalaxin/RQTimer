import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OtpModule } from '../OTP/otp.module';
import { BotSession, BotSessionSchema } from '../schemas/telegram-bot.schema';

@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    MongooseModule.forFeature([
      { name: BotSession.name, schema: BotSessionSchema },
    ]),
    OtpModule,
  ],
  controllers: [UsersController],
})
export class UsersModule {}
