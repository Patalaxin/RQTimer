import * as nodemailer from 'nodemailer';
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
  constructor() {}

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
    await this.storeOtp(email, otp);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.OTP_USER,
        pass: process.env.OTP_PASS,
      },
    });

    const mailOptions = {
      from: `RQTimer ${process.env.OTP_USER}`,
      to: email,
      subject: 'Код подтверждения',
      html: otp_template(otp),
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new BadRequestException('Error sending OTP to email');
    }
  }
}
