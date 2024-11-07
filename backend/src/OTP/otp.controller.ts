import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { IOtp } from './otp.interface';

@ApiTags('OTP API')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('otp')
export class OtpController {
  constructor(@Inject('IOtp') private readonly otpInterface: IOtp) {}

  @ApiOperation({ summary: 'Send OTP on Email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'example@mail.com' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'OTP sent to your email',
    schema: {
      example: { message: 'OTP sent to your email' },
    },
  })
  @Post()
  async sendOtp(@Body('email') email: string): Promise<{ message: string }> {
    await this.otpInterface.sendOtp(email);
    return { message: 'OTP sent to your email' };
  }

  @ApiOperation({ summary: 'Verify OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'prolog19@inbox.ru' },
        otp: { type: 'string', example: '57462' },
      },
      required: ['email', 'otp'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP successfully verified',
    schema: {
      example: { message: 'OTP successfully verified' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
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
