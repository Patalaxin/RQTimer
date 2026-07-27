import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { CleanupRegistryService } from '../cleanup/cleanup-registry.service';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

const EMAIL = 'smoke@example.com';

type OtpRow = {
  email: string;
  otpHash: string;
  verified: boolean;
  expiresAt: Date;
};

describe('OtpService (smoke)', () => {
  let service: OtpService;
  let prisma: {
    otpVerification: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let cleanupTasks: Map<string, () => Promise<number | void>>;

  const row = (overrides: Partial<OtpRow> = {}): OtpRow => ({
    email: EMAIL,
    otpHash: 'hash',
    verified: false,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  });

  beforeEach(async () => {
    mockSend.mockReset().mockResolvedValue({ data: { id: 'mail-id' } });
    cleanupTasks = new Map();

    prisma = {
      otpVerification: {
        upsert: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CleanupRegistryService,
          useValue: {
            register: jest.fn((name, task) => cleanupTasks.set(name, task)),
          },
        },
      ],
    }).compile();

    service = module.get(OtpService);
    service.onModuleInit();
  });

  it('generates a five-digit code', () => {
    for (let i = 0; i < 100; i++) {
      expect(service.generateOtp()).toMatch(/^\d{5}$/);
    }
  });

  describe('sendOtp', () => {
    it('emails the code and stores only its hash', async () => {
      await service.sendOtp(EMAIL);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const sent = mockSend.mock.calls[0][0];
      expect(sent.to).toBe(EMAIL);
      const code = /\b(\d{5})\b/.exec(sent.html)?.[1];
      expect(code).toBeDefined();

      expect(prisma.otpVerification.upsert).toHaveBeenCalledTimes(1);
      const { create } = prisma.otpVerification.upsert.mock.calls[0][0];
      expect(create.otpHash).not.toBe(code);
      await expect(bcrypt.compare(code, create.otpHash)).resolves.toBe(true);
      expect(create.verified).toBe(false);
      expect(create.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('rejects a repeat request while the previous code is still alive', async () => {
      prisma.otpVerification.findUnique.mockResolvedValue(row());

      await expect(service.sendOtp(EMAIL)).rejects.toMatchObject({
        status: 400,
        code: 'OTP_ALREADY_SENT',
      });
      expect(mockSend).not.toHaveBeenCalled();
      expect(prisma.otpVerification.upsert).not.toHaveBeenCalled();
    });

    it('allows a new code once the previous one expired', async () => {
      prisma.otpVerification.findUnique.mockResolvedValue(
        row({ expiresAt: new Date(Date.now() - 1_000) }),
      );

      await service.sendOtp(EMAIL);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(prisma.otpVerification.upsert).toHaveBeenCalledTimes(1);
    });

    it('does not store a code when the mail provider fails', async () => {
      mockSend.mockRejectedValue(new Error('resend down'));

      // Лёг провайдер почты — это 502, а не «исправь запрос».
      await expect(service.sendOtp(EMAIL)).rejects.toMatchObject({
        status: 502,
        code: 'OTP_SEND_FAILED',
      });
      expect(prisma.otpVerification.upsert).not.toHaveBeenCalled();
    });
  });

  describe('validateOtp', () => {
    it('accepts the right code and opens the verified window', async () => {
      const otpHash = await bcrypt.hash('12345', 10);
      prisma.otpVerification.findUnique.mockResolvedValue(row({ otpHash }));

      await expect(service.validateOtp(EMAIL, '12345')).resolves.toBe(true);

      const { where, data } = prisma.otpVerification.update.mock.calls[0][0];
      expect(where).toEqual({ email: EMAIL });
      expect(data.verified).toBe(true);
      // подтверждённый код живёт дольше исходной минуты — чтобы успеть завершить signup
      expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now() + 60_000);
    });

    it('rejects a wrong code without touching the record', async () => {
      const otpHash = await bcrypt.hash('12345', 10);
      prisma.otpVerification.findUnique.mockResolvedValue(row({ otpHash }));

      await expect(service.validateOtp(EMAIL, '54321')).resolves.toBe(false);
      expect(prisma.otpVerification.update).not.toHaveBeenCalled();
    });

    it('rejects an expired code', async () => {
      const otpHash = await bcrypt.hash('12345', 10);
      prisma.otpVerification.findUnique.mockResolvedValue(
        row({ otpHash, expiresAt: new Date(Date.now() - 1_000) }),
      );

      await expect(service.validateOtp(EMAIL, '12345')).resolves.toBe(false);
      expect(prisma.otpVerification.update).not.toHaveBeenCalled();
    });

    it('rejects an unknown email', async () => {
      await expect(service.validateOtp(EMAIL, '12345')).resolves.toBe(false);
    });
  });

  describe('isEmailVerified', () => {
    it('true when verified and inside the window', async () => {
      prisma.otpVerification.findUnique.mockResolvedValue(
        row({ verified: true }),
      );
      await expect(service.isEmailVerified(EMAIL)).resolves.toBe(true);
    });

    it('false when the verified window has closed', async () => {
      prisma.otpVerification.findUnique.mockResolvedValue(
        row({ verified: true, expiresAt: new Date(Date.now() - 1_000) }),
      );
      await expect(service.isEmailVerified(EMAIL)).resolves.toBe(false);
    });

    it('false when the code was never verified', async () => {
      prisma.otpVerification.findUnique.mockResolvedValue(
        row({ verified: false }),
      );
      await expect(service.isEmailVerified(EMAIL)).resolves.toBe(false);
    });

    it('false for an unknown email', async () => {
      await expect(service.isEmailVerified(EMAIL)).resolves.toBe(false);
    });
  });

  it('removeVerifiedEmail drops the record', async () => {
    await service.removeVerifiedEmail(EMAIL);
    expect(prisma.otpVerification.deleteMany).toHaveBeenCalledWith({
      where: { email: EMAIL },
    });
  });

  it('registers a cleanup task that deletes expired rows', async () => {
    const task = cleanupTasks.get('otp_verifications');
    expect(task).toBeDefined();

    prisma.otpVerification.deleteMany.mockResolvedValue({ count: 3 });
    await expect(task()).resolves.toBe(3);

    const { where } = prisma.otpVerification.deleteMany.mock.calls[0][0];
    expect(where.expiresAt.lt).toBeInstanceOf(Date);
  });
});
