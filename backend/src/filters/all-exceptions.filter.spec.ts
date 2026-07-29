import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter, ErrorBody } from './all-exceptions.filter';
import {
  ConflictError,
  NotFoundError,
  UpstreamError,
} from '../errors/app.error';

const prismaError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: 'test',
    meta,
  });

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;
  let logged: jest.SpyInstance;

  const render = (exception: unknown): ErrorBody => {
    filter.catch(exception, host);
    expect(status).toHaveBeenCalledTimes(1);
    return json.mock.calls[0][0] as ErrorBody;
  };

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    logged = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    filter = new AllExceptionsFilter();
  });

  afterEach(() => jest.restoreAllMocks());

  describe('доменные ошибки', () => {
    it('отдаёт код и статус, объявленные самой ошибкой', () => {
      const body = render(new NotFoundError('MOB_NOT_FOUND', 'Mob not found'));

      expect(body).toEqual({
        statusCode: 404,
        code: 'MOB_NOT_FOUND',
        message: 'Mob not found',
      });
      expect(status).toHaveBeenCalledWith(404);
    });

    it('категория ошибки определяет статус', () => {
      expect(render(new ConflictError('X', 'x')).statusCode).toBe(409);
      filter.catch(new UpstreamError('Y', 'y'), host);
      expect(status).toHaveBeenLastCalledWith(502);
    });
  });

  describe('исключения Nest', () => {
    it('переводит статус в код, сохраняя текст', () => {
      expect(
        render(new UnauthorizedException('Login or password invalid')),
      ).toEqual({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Login or password invalid',
      });
    });

    it('сохраняет список нарушений от ValidationPipe массивом', () => {
      const body = render(
        new BadRequestException({
          statusCode: 400,
          message: ['email must be an email', 'password is too short'],
          error: 'Bad Request',
        }),
      );

      expect(body.code).toBe('BAD_REQUEST');
      expect(body.message).toEqual([
        'email must be an email',
        'password is too short',
      ]);
    });

    it('не теряет статус, для которого нет именованного кода', () => {
      const body = render(new HttpException('teapot', 418));

      expect(body).toEqual({
        statusCode: 418,
        code: 'HTTP_418',
        message: 'teapot',
      });
    });

    it('проходит насквозь ошибки гардов без своего тела', () => {
      expect(render(new ForbiddenException()).code).toBe('FORBIDDEN');
    });
  });

  describe('ошибки Prisma', () => {
    it('переводит нарушение уникальности в 409 с перечислением полей', () => {
      const body = render(
        prismaError('P2002', { target: ['email', 'nickname'] }),
      );

      expect(body).toEqual({
        statusCode: 409,
        code: 'UNIQUE_VIOLATION',
        message: 'email, nickname already exists',
      });
    });

    it('переживает P2002 без meta', () => {
      expect(render(prismaError('P2002')).message).toBe(
        'Resource already exists',
      );
    });

    it('переводит отсутствующую строку в 404', () => {
      expect(render(prismaError('P2025')).code).toBe('NOT_FOUND');
    });

    it('переводит нарушение внешнего ключа в 409', () => {
      expect(render(prismaError('P2003')).code).toBe('FOREIGN_KEY_VIOLATION');
    });

    it('незнакомый код Prisma отвечает 500 и не раскрывает деталей', () => {
      const body = render(prismaError('P1001'));

      expect(body.statusCode).toBe(500);
      expect(body.code).toBe('DATABASE_ERROR');
      expect(body.message).toBe('Unexpected database error');
    });
  });

  describe('неопознанные ошибки', () => {
    it('отвечает ровным 500 и не выносит наружу текст ошибки', () => {
      const body = render(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

      expect(body).toEqual({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Unexpected error',
      });
      expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
    });

    it('переживает брошенное не-Error значение', () => {
      expect(render('строка вместо ошибки').statusCode).toBe(500);
    });

    it('пишет настоящую причину в лог, раз её нет в ответе', () => {
      render(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

      expect(logged).toHaveBeenCalledTimes(1);
      expect(logged.mock.calls[0][0]).toContain('ECONNREFUSED');
    });

    it('не логирует ошибки клиента', () => {
      render(new NotFoundError('MOB_NOT_FOUND', 'Mob not found'));

      expect(logged).not.toHaveBeenCalled();
    });
  });

  describe('секреты', () => {
    it('вычищает ключ из URL, попавшего в сообщение и стектрейс', () => {
      const error = new Error(
        'Request failed: https://api.timezonedb.com/v2.1/get-time-zone?key=SUPERSECRET&format=json',
      );

      render(error);

      const [message, stack] = logged.mock.calls[0];
      expect(message).not.toContain('SUPERSECRET');
      expect(message).toContain('key=<redacted>');
      expect(stack).not.toContain('SUPERSECRET');
    });

    it('вычищает заголовок Authorization', () => {
      render(
        new Error('authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig'),
      );

      expect(logged.mock.calls[0][0]).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    });
  });

  it('статус ответа всегда совпадает с полем statusCode в теле', () => {
    for (const exception of [
      new NotFoundError('A', 'a'),
      new UnauthorizedException(),
      prismaError('P2002'),
      new Error('unknown'),
    ]) {
      status.mockClear();
      json.mockClear();
      filter.catch(exception, host);

      const body = json.mock.calls[0][0] as ErrorBody;
      expect(status).toHaveBeenCalledWith(body.statusCode);
    }
  });
});
