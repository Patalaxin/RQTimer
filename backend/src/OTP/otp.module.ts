import { forwardRef, Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [OtpService, { provide: 'IOtp', useClass: OtpService }],
  controllers: [OtpController],
  imports: [forwardRef(() => UsersModule)],
  exports: [OtpService],
})
export class OtpModule {}
