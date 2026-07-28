import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TokensGuard } from './tokens.guard';
import { Public } from '../decorators/public.decorator';
import { UsersController } from '../users/users.controller';
import { AuthController } from '../auth/auth.controller';
import { NotificationController } from '../notification/notification.controller';
import { RolesGuard } from './roles.guard';

/** Ручки, на которых guard проверяется: одна открыта декоратором, вторая нет. */
class TestController {
  @Public()
  open(): void {}

  closed(): void {}
}

describe('TokensGuard', () => {
  let guard: TokensGuard;
  let verifyAsync: jest.Mock;
  let request: { headers: { authorization?: string }; user?: unknown };

  const contextFor = (handler: (...args: unknown[]) => unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => handler,
      getClass: () => TestController,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    verifyAsync = jest.fn();
    request = { headers: {} };
    guard = new TokensGuard(
      { verifyAsync } as unknown as JwtService,
      new Reflector(),
    );
  });

  it('без заголовка Authorization отвечает 401', async () => {
    await expect(
      guard.canActivate(contextFor(TestController.prototype.closed)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('с валидным токеном пропускает и кладёт пользователя в запрос', async () => {
    const user = { email: 'user@example.com', role: 'User' };
    verifyAsync.mockResolvedValue(user);
    request.headers.authorization = 'Bearer token';

    await expect(
      guard.canActivate(contextFor(TestController.prototype.closed)),
    ).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('token');
    expect(request.user).toBe(user);
  });

  it('с невалидным токеном отвечает 401', async () => {
    verifyAsync.mockRejectedValue(new Error('jwt expired'));
    request.headers.authorization = 'Bearer token';

    await expect(
      guard.canActivate(contextFor(TestController.prototype.closed)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  // Заголовок чужой схемы — это отсутствие токена, а не токен «Basic ...».
  it('не принимает схему кроме Bearer', async () => {
    request.headers.authorization = 'Basic dXNlcjpwYXNz';

    await expect(
      guard.canActivate(contextFor(TestController.prototype.closed)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('ручку с @Public() пропускает без токена', async () => {
    await expect(
      guard.canActivate(contextFor(TestController.prototype.open)),
    ).resolves.toBe(true);
    expect(verifyAsync).not.toHaveBeenCalled();
  });
});

/**
 * Guard теперь висит на классе, а открытость ручки держится на @Public().
 * Тест фиксирует ровно тот список открытых ручек, который был до правки:
 * лишняя строчка @Public() иначе никак себя не проявит.
 */
describe('публичные ручки контроллеров', () => {
  const reflector = new Reflector();

  const guardsOf = (target: object): unknown[] =>
    (Reflect.getMetadata('__guards__', target) as unknown[]) ?? [];

  const publicHandlersOf = (controller: new (...args: never[]) => object) =>
    Object.getOwnPropertyNames(controller.prototype)
      .filter((name) => name !== 'constructor')
      .filter((name) =>
        reflector.get<boolean>('isPublic', controller.prototype[name]),
      )
      .sort();

  it.each([
    ['UsersController', UsersController, [TokensGuard, RolesGuard]],
    ['AuthController', AuthController, [TokensGuard]],
    [
      'NotificationController',
      NotificationController,
      [TokensGuard, RolesGuard],
    ],
  ])('%s закрыт guard-ом на уровне класса', (_name, controller, expected) => {
    expect(guardsOf(controller)).toEqual(expected);
  });

  it('в users открыты только регистрация, восстановление пароля и счётчик', () => {
    expect(publicHandlersOf(UsersController)).toEqual([
      'create',
      'forgotPassword',
      'getUsersCount',
    ]);
  });

  it('в auth открыты только вход и обмен refresh-токена', () => {
    expect(publicHandlersOf(AuthController)).toEqual([
      'exchangeRefresh',
      'signIn',
    ]);
  });

  it('в notifications открыто только чтение', () => {
    expect(publicHandlersOf(NotificationController)).toEqual(['findAll']);
  });
});
