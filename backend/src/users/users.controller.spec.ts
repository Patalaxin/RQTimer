import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { RolesTypes } from '../schemas/roles.enum';

/**
 * Guard теперь стоит на классе, поэтому цена ошибки в обе стороны: закрытая
 * регистрация или открытый список пользователей. Проверяем настоящим запросом
 * по HTTP — сервисы замоканы, ни базы, ни телеграма здесь нет.
 */
describe('доступ к ручкам users и auth по HTTP', () => {
  let app: INestApplication;
  let url: string;
  let verifyAsync: jest.Mock;

  const usersService = {
    createUser: jest.fn().mockResolvedValue({ email: 'new@example.com' }),
    findAll: jest.fn().mockResolvedValue({ users: [], total: 0 }),
    forgotPassword: jest.fn().mockResolvedValue({ status: 'ok' }),
    getUsersCount: jest.fn().mockResolvedValue({ count: 42 }),
    findUser: jest.fn().mockResolvedValue({ email: 'user@example.com' }),
  };

  const authService = {
    signIn: jest.fn().mockResolvedValue({ accessToken: 'token' }),
  };

  const request = (path: string, init?: RequestInit) =>
    fetch(`${url}${path}`, init);

  beforeAll(async () => {
    verifyAsync = jest.fn();

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController, AuthController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: authService },
        { provide: JwtService, useValue: { verifyAsync } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    url = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('открыто без токена', () => {
    it('регистрация', async () => {
      const res = await request('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', password: 'pass' }),
      });

      expect(res.status).toBe(201);
      expect(usersService.createUser).toHaveBeenCalled();
    });

    it('вход', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'pass' }),
      });

      expect(res.status).toBe(201);
      expect(authService.signIn).toHaveBeenCalled();
    });

    it('восстановление пароля', async () => {
      const res = await request('/users/forgot-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      expect(res.status).toBe(200);
    });

    it('счётчик пользователей', async () => {
      expect((await request('/users/stats/count')).status).toBe(200);
    });
  });

  describe('закрыто без токена', () => {
    it.each([
      ['GET', '/users'],
      ['GET', '/users/list'],
      ['GET', '/users/specific-user/user@example.com'],
      ['DELETE', '/users/user@example.com'],
    ])('%s %s отвечает 401', async (method, path) => {
      expect((await request(path, { method })).status).toBe(401);
    });
  });

  describe('с токеном', () => {
    it('обычный пользователь получает свои данные', async () => {
      verifyAsync.mockResolvedValue({
        email: 'user@example.com',
        role: RolesTypes.User,
      });

      const res = await request('/users', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(res.status).toBe(200);
      expect(usersService.findUser).toHaveBeenCalledWith('user@example.com');
    });

    it('обычному пользователю список всех закрыт', async () => {
      verifyAsync.mockResolvedValue({
        email: 'user@example.com',
        role: RolesTypes.User,
      });

      const res = await request('/users/list', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(res.status).toBe(403);
      expect(usersService.findAll).not.toHaveBeenCalled();
    });

    it('админ получает список всех', async () => {
      verifyAsync.mockResolvedValue({
        email: 'admin@example.com',
        role: RolesTypes.Admin,
      });

      const res = await request('/users/list', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(res.status).toBe(200);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });
});
