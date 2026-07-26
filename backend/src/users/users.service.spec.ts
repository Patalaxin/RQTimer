import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { OtpService } from '../OTP/otp.service';
import { PrismaService } from '../prisma/prisma.service';

const EMAIL = 'smoke@example.com';
const NICKNAME = 'Smoke';
const PASSWORD = 'Passw0rd';

/**
 * Спек снимает поведение как оно есть сейчас, до правки кодов ответа. Места,
 * которые этап 3 менять будет намеренно, помечены TODO(этап 3) — если такой
 * тест упал, значит контракт поменялся осознанно, а не случайно.
 */
describe('UsersService (smoke)', () => {
  let service: UsersService;
  let prisma: any;
  let otpService: {
    isEmailVerified: jest.Mock;
    removeVerifiedEmail: jest.Mock;
  };

  const user = (overrides = {}) => ({
    id: 'user-1',
    email: EMAIL,
    nickname: NICKNAME,
    role: 'User',
    isGroupLeader: false,
    groupName: null,
    excludedMobs: [],
    passwordHash: 'stored-hash',
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      botSession: { upsert: jest.fn() },
    };
    otpService = {
      isEmailVerified: jest.fn().mockResolvedValue(true),
      removeVerifiedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: OtpService, useValue: otpService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('createUser', () => {
    const dto = { email: EMAIL, nickname: NICKNAME, password: PASSWORD } as any;

    it('stores a hash instead of the password and clears the OTP', async () => {
      prisma.user.create.mockResolvedValue(user());

      await service.createUser(dto);

      const { data } = prisma.user.create.mock.calls[0][0];
      expect(data).not.toHaveProperty('password');
      expect(data.passwordHash).not.toBe(PASSWORD);
      await expect(bcrypt.compare(PASSWORD, data.passwordHash)).resolves.toBe(
        true,
      );
      expect(otpService.removeVerifiedEmail).toHaveBeenCalledWith(EMAIL);
    });

    it('never returns the password hash', async () => {
      prisma.user.create.mockResolvedValue(user());

      const result = await service.createUser(dto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toEqual({
        _id: 'user-1',
        email: EMAIL,
        nickname: NICKNAME,
        role: 'User',
        isGroupLeader: false,
        groupName: null,
        excludedMobs: [],
      });
    });

    it('refuses an email that has not passed OTP', async () => {
      otpService.isEmailVerified.mockResolvedValue(false);

      await expect(service.createUser(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    // TODO(этап 3): занятые email/nickname — это конфликт, 409, а не 400.
    // Плюс сама проверка идёт отдельным SELECT перед INSERT: между ними можно
    // вклиниться. Заменяется на уникальный индекс + P2002.
    it('refuses a taken email or nickname with 400', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      await expect(service.createUser(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('checks both email and nickname case-insensitively', async () => {
      prisma.user.create.mockResolvedValue(user());

      await service.createUser(dto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: { equals: EMAIL, mode: 'insensitive' } },
            { nickname: { equals: NICKNAME, mode: 'insensitive' } },
          ],
        },
      });
    });
  });

  describe('findUser', () => {
    it('finds by email or nickname with one query', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      const result = await service.findUser(NICKNAME);

      expect(result._id).toBe('user-1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    // TODO(этап 3): отсутствующий пользователь — это 404, а не 400.
    it('reports a missing user with 400', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findUser(EMAIL)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('paginates and never selects the password hash', async () => {
      prisma.user.count.mockResolvedValue(25);
      prisma.user.findMany.mockResolvedValue([user()]);

      const result = await service.findAll(3, 10);

      const { skip, take, select } = prisma.user.findMany.mock.calls[0][0];
      expect({ skip, take }).toEqual({ skip: 20, take: 10 });
      expect(select).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({ total: 25, page: 3, pages: 3 });
    });
  });

  describe('changePassword', () => {
    it('rehashes the new password and writes it', async () => {
      const oldHash = await bcrypt.hash(PASSWORD, 10);
      prisma.user.findUniqueOrThrow.mockResolvedValue(
        user({ passwordHash: oldHash }),
      );

      await service.changePassword(EMAIL, {
        oldPassword: PASSWORD,
        newPassword: 'NewPassw0rd',
      } as any);

      const { data } = prisma.user.update.mock.calls[0][0];
      expect(data.passwordHash).not.toBe('NewPassw0rd');
      await expect(
        bcrypt.compare('NewPassw0rd', data.passwordHash),
      ).resolves.toBe(true);
    });

    // TODO(этап 3): неверный текущий пароль — это 401, а не 400.
    it('refuses a wrong current password with 400', async () => {
      const oldHash = await bcrypt.hash(PASSWORD, 10);
      prisma.user.findUniqueOrThrow.mockResolvedValue(
        user({ passwordHash: oldHash }),
      );

      await expect(
        service.changePassword(EMAIL, {
          oldPassword: 'NotTheOne1',
          newPassword: 'NewPassw0rd',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    // TODO(этап 3): здесь наружу летит сырая ошибка Prisma, и глобальный фильтр
    // переводит её в невнятное 404 "Resource not found" вместо доменного текста.
    it('lets the raw Prisma error escape when the user is gone', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.changePassword(EMAIL, {
          oldPassword: PASSWORD,
          newPassword: 'NewPassw0rd',
        } as any),
      ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    });
  });

  describe('forgotPassword', () => {
    it('resets the password and burns the OTP', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      await service.forgotPassword({
        email: EMAIL,
        newPassword: 'NewPassw0rd',
      } as any);

      const { data } = prisma.user.update.mock.calls[0][0];
      await expect(
        bcrypt.compare('NewPassw0rd', data.passwordHash),
      ).resolves.toBe(true);
      expect(otpService.removeVerifiedEmail).toHaveBeenCalledWith(EMAIL);
    });

    it('refuses email and nickname together', async () => {
      await expect(
        service.forgotPassword({
          email: EMAIL,
          nickname: NICKNAME,
          newPassword: 'NewPassw0rd',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses neither email nor nickname', async () => {
      await expect(
        service.forgotPassword({ newPassword: 'NewPassw0rd' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses an email that has not passed OTP', async () => {
      otpService.isEmailVerified.mockResolvedValue(false);

      await expect(
        service.forgotPassword({
          email: EMAIL,
          newPassword: 'NewPassw0rd',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    // TODO(этап 3): отсутствующий пользователь — это 404, а не 400.
    it('reports a missing user with 400', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.forgotPassword({
          email: EMAIL,
          newPassword: 'NewPassw0rd',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('updates the role of the user found by nickname', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      await service.updateRole({ nickname: NICKNAME, role: 'Admin' } as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'Admin' },
      });
    });

    it('refuses email and nickname together', async () => {
      await expect(
        service.updateRole({
          email: EMAIL,
          nickname: NICKNAME,
          role: 'Admin',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses neither email nor nickname', async () => {
      await expect(
        service.updateRole({ role: 'Admin' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // TODO(этап 3): отсутствующий пользователь — это 404, а не 400.
    it('reports a missing user with 400', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRole({ email: EMAIL, role: 'Admin' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteOne', () => {
    it('deletes by email or nickname', async () => {
      await service.deleteOne(NICKNAME);

      expect(prisma.user.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: { equals: NICKNAME, mode: 'insensitive' } },
            { nickname: { equals: NICKNAME, mode: 'insensitive' } },
          ],
        },
      });
    });

    it('refuses an empty identifier', async () => {
      await expect(service.deleteOne('')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.deleteMany).not.toHaveBeenCalled();
    });

    // Удаление несуществующего пользователя молча проходит: deleteMany на
    // пустой выборке ничего не делает, наружу всё равно уходит "User deleted".
    it('reports success even when nothing matched', async () => {
      prisma.user.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteOne('ghost')).resolves.toMatchObject({
        message: 'User deleted',
      });
    });
  });

  describe('updateTimezone', () => {
    it('upserts the bot session so a user without one still gets a timezone', async () => {
      prisma.botSession.upsert.mockResolvedValue({ email: EMAIL });

      await service.updateTimezone(EMAIL, 'Europe/Moscow');

      expect(prisma.botSession.upsert).toHaveBeenCalledWith({
        where: { email: EMAIL },
        create: { email: EMAIL, timezone: 'Europe/Moscow' },
        update: { timezone: 'Europe/Moscow' },
      });
    });
  });
});
