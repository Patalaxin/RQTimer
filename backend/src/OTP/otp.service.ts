import { Resend } from 'resend';
import { BadRequestException } from '@nestjs/common';
import * as process from 'process';
import { otp_template } from './otp-template';
import { IOtp } from './otp.interface';

interface OtpRecord {
  otp: string;
  expiresAt: number;
}

export const otpStore: Record<string, OtpRecord> = {};
export const verifiedUsers: Set<string> = new Set();

export class OtpService implements IOtp {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  generateOtp(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  async storeOtp(email: string, otp: string): Promise<void> {
    const expiresAt: number = Date.now() + 60000;
    otpStore[email] = { otp, expiresAt };

    setTimeout((): void => {
      delete otpStore[email];
    }, 60000);
  }

  validateOtp(email: string, otp: string): boolean {
    const record: OtpRecord = otpStore[email];
    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return false;
    }

    delete otpStore[email];
    verifiedUsers.add(email);
    return true;
  }

  isEmailVerified(email: string): boolean {
    return verifiedUsers.has(email);
  }

  removeVerifiedEmail(email: string): void {
    verifiedUsers.delete(email);
  }

  async sendOtp(email: string): Promise<void> {
    if (otpStore[email]) {
      throw new BadRequestException(
        'OTP has already been sent. If you did not receive the code, please request again in one minute.',
      );
    }

    const otp: string = this.generateOtp();

    try {
      const result = await this.resend.emails.send({
        from: process.env.OTP_FROM,
        to: email,
        subject: 'Код подтверждения',
        html: otp_template(otp),
      });
      console.log('Resend! result:', result);
      await this.storeOtp(email, otp);
    } catch (error) {
      console.error('Resend error:', error);

      throw new BadRequestException('Error sending OTP to email');
    }
  }
}
