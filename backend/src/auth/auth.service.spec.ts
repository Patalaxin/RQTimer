import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthGateway } from './auth.gateway';
import { PrismaService } from '../prisma/prisma.service';

const EMAIL = 'smoke@example.com';
const NICKNAME = 'Smoke';
const PASSWORD = 'Passw0rd';

/**
 * Спек снимает поведение как оно есть сейчас, до правки кодов ответа. Места,
 * которые этап 3 менять будет намеренно, помечены TODO(этап 3) — если такой
 * тест упал, значит контракт поменялся осознанно, а не случайно.
 */
describe('AuthService (smoke)', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: { signAsync: jest.Mock };
  let authGateway: {
    getClientByEmail: jest.Mock;
    sendUserStatusUpdate: jest.Mock;
  };
  let res: Response & { cookie: jest.Mock };
  let passwordHash: string;

  const user = (overrides = {}) => ({
    id: 'user-1',
    email: EMAIL,
    nickname: NICKNAME,
    role: 'User',
    groupName: null,
    isGroupLeader: false,
    passwordHash,
    ...overrides,
  });

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 10);
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      refreshToken: {
        upsert: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('access-token') };
    authGateway = {
      getClientByEmail: jest.fn().mockReturnValue(undefined),
      sendUserStatusUpdate: jest.fn(),
    };
    res = { cookie: jest.fn() } as unknown as Response & { cookie: jest.Mock };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: AuthGateway, useValue: authGateway },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('signIn', () => {
    it('issues both tokens and puts the refresh token in an httpOnly cookie', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      const result = await service.signIn(res, {
        email: EMAIL,
        password: PASSWORD,
      } as any);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));

      const [name, value, options] = res.cookie.mock.calls[0];
      expect(name).toBe('refreshToken');
      expect(value).toBe(result.refreshToken);
      expect(options).toMatchObject({ httpOnly: true, secure: true });
    });

    it('never puts the password hash into the JWT payload', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      await service.signIn(res, { email: EMAIL, password: PASSWORD } as any);

      const [payload] = jwtService.signAsync.mock.calls[0];
      expect(payload).not.toHaveProperty('passwordHash');
      expect(payload).toEqual({
        email: EMAIL,
        nickname: NICKNAME,
        role: 'User',
        groupName: null,
        isGroupLeader: false,
      });
    });

    it('stores the refresh token hashed, never in the clear', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      const { refreshToken } = await service.signIn(res, {
        email: EMAIL,
        password: PASSWORD,
      } as any);

      const { create, update } = prisma.refreshToken.upsert.mock.calls[0][0];
      expect(create.tokenHash).not.toBe(refreshToken);
      expect(update.tokenHash).not.toBe(refreshToken);
      await expect(
        bcrypt.compare(refreshToken, create.tokenHash),
      ).resolves.toBe(true);
    });

    it('looks the user up case-insensitively', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      await service.signIn(res, {
        email: EMAIL.toUpperCase(),
        password: PASSWORD,
      } as any);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: { equals: EMAIL.toUpperCase(), mode: 'insensitive' } },
      });
    });

    it('falls back to the nickname when no email is given', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      await service.signIn(res, {
        nickname: NICKNAME,
        password: PASSWORD,
      } as any);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { nickname: { equals: NICKNAME, mode: 'insensitive' } },
      });
    });

    it('rejects email and nickname sent together', async () => {
      await expect(
        service.signIn(res, {
          email: EMAIL,
          nickname: NICKNAME,
          password: PASSWORD,
        } as any),
      ).rejects.toMatchObject({ status: 400, code: 'AMBIGUOUS_IDENTIFIER' });
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a wrong password with 401', async () => {
      prisma.user.findFirst.mockResolvedValue(user());

      await expect(
        service.signIn(res, { email: EMAIL, password: 'WrongPass1' } as any),
      ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('rejects an unknown user with 401 as well', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.signIn(res, { email: EMAIL, password: PASSWORD } as any),
      ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    });

    // Обе ветки обязаны быть неотличимы целиком: раньше совпадал только текст,
    // а код ответа (400 против 401) выдавал, существует ли аккаунт.
    it('is indistinguishable between an unknown user and a wrong password', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const unknownUser = await service
        .signIn(res, { email: EMAIL, password: PASSWORD } as any)
        .catch((error) => error);

      prisma.user.findFirst.mockResolvedValue(user());
      const wrongPassword = await service
        .signIn(res, { email: EMAIL, password: 'WrongPass1' } as any)
        .catch((error) => error);

      expect(unknownUser.message).toBe(wrongPassword.message);
      expect(unknownUser.getStatus()).toBe(wrongPassword.getStatus());
      expect(unknownUser.code).toBe(wrongPassword.code);
    });

    // Без сверки с фиктивным хэшем ветка «пользователя нет» возвращалась почти
    // мгновенно, и аккаунты перебирались по времени ответа.
    it('hashes even when the user is absent, so timing does not leak', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const compare = jest.spyOn(bcrypt, 'compare');

      await service
        .signIn(res, { email: EMAIL, password: PASSWORD } as any)
        .catch(() => undefined);

      expect(compare).toHaveBeenCalledTimes(1);
    });

    it('marks the user online when a socket is connected', async () => {
      prisma.user.findFirst.mockResolvedValue(user());
      const client = { id: 'socket-1' };
      authGateway.getClientByEmail.mockReturnValue(client);

      await service.signIn(res, { email: EMAIL, password: PASSWORD } as any);

      expect(authGateway.sendUserStatusUpdate).toHaveBeenCalledWith(
        client,
        EMAIL,
        'online',
      );
    });
  });

  describe('exchangeRefresh', () => {
    const storedFor = async (rawToken: string) => ({
      ...user(),
      refreshToken: { tokenHash: await bcrypt.hash(rawToken, 10) },
    });

    it('rotates the token: the new one differs and replaces the stored hash', async () => {
      const oldToken = 'old-refresh-token';
      prisma.user.findFirst.mockResolvedValue(await storedFor(oldToken));

      const result = await service.exchangeRefresh(
        res,
        { email: EMAIL } as any,
        oldToken,
      );

      expect(result.refreshToken).not.toBe(oldToken);
      const { update } = prisma.refreshToken.upsert.mock.calls[0][0];
      await expect(
        bcrypt.compare(result.refreshToken, update.tokenHash),
      ).resolves.toBe(true);
    });

    // Все отказы здесь обязаны оставаться 401: интерцептор фронта именно по
    // 401 от exchange-refresh разлогинивает пользователя.
    it('rejects a missing refresh token', async () => {
      await expect(
        service.exchangeRefresh(res, { email: EMAIL } as any, ''),
      ).rejects.toMatchObject({ status: 401, code: 'REFRESH_TOKEN_MISSING' });
    });

    it('rejects a user with no stored refresh token', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...user(),
        refreshToken: null,
      });

      await expect(
        service.exchangeRefresh(res, { email: EMAIL } as any, 'whatever'),
      ).rejects.toMatchObject({ status: 401, code: 'REFRESH_TOKEN_UNKNOWN' });
    });

    it('rejects a refresh token that does not match the stored hash', async () => {
      prisma.user.findFirst.mockResolvedValue(await storedFor('the-real-one'));

      await expect(
        service.exchangeRefresh(res, { email: EMAIL } as any, 'a-forged-one'),
      ).rejects.toMatchObject({ status: 401, code: 'REFRESH_TOKEN_INVALID' });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('rejects email and nickname sent together', async () => {
      await expect(
        service.exchangeRefresh(
          res,
          { email: EMAIL, nickname: NICKNAME } as any,
          'token',
        ),
      ).rejects.toMatchObject({ status: 401, code: 'AMBIGUOUS_IDENTIFIER' });
    });
  });

  describe('signOut', () => {
    it('drops the stored refresh token and expires the cookie', async () => {
      prisma.user.findUnique.mockResolvedValue(user());

      const result = await service.signOut(res, EMAIL);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      const [, value, options] = res.cookie.mock.calls[0];
      expect(value).toBe('');
      expect(options).toMatchObject({ maxAge: 0 });
      expect(result.message).toBe('Successfully logged out');
    });

    it('still expires the cookie for an unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.signOut(res, EMAIL)).resolves.toBeDefined();
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalled();
    });
  });
});
