import { Resend } from 'resend';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UpstreamError, ValidationError } from '../errors/app.error';
import * as bcrypt from 'bcrypt';
import { otp_template } from './otp-template';
import { PrismaService } from '../prisma/prisma.service';
import { CleanupRegistryService } from '../cleanup/cleanup-registry.service';

const OTP_TTL_MS = 60_000; // время жизни неподтверждённого кода
const VERIFIED_TTL_MS = 10 * 60_000; // окно на завершение signup/forgot-password после подтверждения

@Injectable()
export class OtpService implements OnModuleInit {
  private readonly logger = new Logger(OtpService.name);

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
      data: {
        verified: true,
        expiresAt: new Date(Date.now() + VERIFIED_TTL_MS),
      },
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
      throw new ValidationError(
        'OTP_ALREADY_SENT',
        'OTP has already been sent. If you did not receive the code, please request again in one minute.',
      );
    }

    const otp: string = this.generateOtp();

    let sent: Awaited<ReturnType<typeof this.resend.emails.send>>;
    try {
      sent = await this.resend.emails.send({
        from: process.env.OTP_FROM,
        to: email,
        subject: 'Код подтверждения',
        html: otp_template(otp),
      });
    } catch (error) {
      // Сюда попадает только сеть: сам Resend отказы отдаёт полем error.
      this.logger.error(
        'Resend не ответил',
        error instanceof Error ? error.stack : String(error),
      );

      // Лёг почтовый провайдер — виноват не клиент. 400 говорил «исправь
      // запрос», хотя исправлять нечего и повтор имеет смысл.
      throw new UpstreamError('OTP_SEND_FAILED', 'Error sending OTP to email');
    }

    // resend.emails.send отказ не бросает, а возвращает `{ data: null, error }`
    // — просроченный ключ или выбранная квота молча доезжали до storeOtp.
    // Пользователь получал 200, ждал письмо, которого нет, и ещё минуту не мог
    // запросить код заново: строка-то создана.
    if (sent.error) {
      this.logger.error(
        `Resend отклонил письмо: ${sent.error.name} ${sent.error.message}`,
      );
      throw new UpstreamError('OTP_SEND_FAILED', 'Error sending OTP to email');
    }

    this.logger.debug(`Код отправлен, id письма ${sent.data?.id}`);
    await this.storeOtp(email, otp);
  }
}
