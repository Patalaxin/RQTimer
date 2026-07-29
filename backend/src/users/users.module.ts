import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OtpModule } from '../OTP/otp.module';

@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports: [OtpModule],
  controllers: [UsersController],
})
export class UsersModule {}
