import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';

@Module({
  providers: [OtpService, { provide: 'IOtp', useClass: OtpService }],
  controllers: [OtpController],
  exports: [OtpService],
})
export class OtpModule {}
