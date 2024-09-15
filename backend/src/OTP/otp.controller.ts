import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IOtp } from './otp.interface';

@ApiTags('OTP API')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('otp')
export class OtpController {
  constructor(@Inject('IOtp') private readonly otpInterface: IOtp) {}

  @ApiOperation({ summary: 'Send OTP on Email' })
  @Post()
  async sendOtp(@Body('email') email: string): Promise<{ message: string }> {
    await this.otpInterface.sendOtp(email);
    return { message: 'OTP sent to your email' };
  }

  @ApiOperation({ summary: 'Verify OTP' })
  @Post('verify')
  verifyOtp(
    @Body('email') email: string,
    @Body('otp') otp: string,
  ): { message: string } {
    const isValid = this.otpInterface.validateOtp(email, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    return { message: 'OTP successfully verified' };
  }
}
