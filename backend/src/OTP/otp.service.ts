import { Resend } from 'resend';
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { otp_template } from './otp-template';
import { PrismaService } from '../prisma/prisma.service';
import { CleanupRegistryService } from '../cleanup/cleanup-registry.service';

const OTP_TTL_MS = 60_000; // время жизни неподтверждённого кода
const VERIFIED_TTL_MS = 10 * 60_000; // окно на завершение signup/forgot-password после подтверждения

@Injectable()
export class OtpService implements OnModuleInit {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cleanupRegistry: CleanupRegistryService,
  ) {}

  onModuleInit(): void {
    this.cleanupRegistry.register('otp_verifications', async () => {
      const { count } = await this.prisma.otpVerification.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      return count;
    });
  }

  generateOtp(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  async storeOtp(email: string, otp: string): Promise<void> {
    const otpHash = await bcrypt.hash(otp, 10);
    await this.prisma.otpVerification.upsert({
      where: { email },
      create: {
        email,
        otpHash,
        verified: false,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
      update: {
        otpHash,
        verified: false,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
  }

  async validateOtp(email: string, otp: string): Promise<boolean> {
    const record = await this.prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!record || record.expiresAt < new Date()) {
      return false;
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      return false;
    }

    await this.prisma.otpVerification.update({
      where: { email },
      data: { verified: true, expiresAt: new Date(Date.now() + VERIFIED_TTL_MS) },
    });

    return true;
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const record = await this.prisma.otpVerification.findUnique({
      where: { email },
    });
    return !!record?.verified && record.expiresAt >= new Date();
  }

  async removeVerifiedEmail(email: string): Promise<void> {
    await this.prisma.otpVerification.deleteMany({ where: { email } });
  }

  async sendOtp(email: string): Promise<void> {
    const existing = await this.prisma.otpVerification.findUnique({
      where: { email },
    });
    if (existing && !existing.verified && existing.expiresAt > new Date()) {
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
