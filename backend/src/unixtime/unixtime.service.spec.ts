import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { UnixtimeService } from './unixtime.service';
import { configProvider } from '../config/config.testing';

const API_KEY = 'SUPERSECRET';

describe('UnixtimeService (smoke)', () => {
  let service: UnixtimeService;
  let httpService: { get: jest.Mock };
  let logged: string[];

  beforeEach(async () => {
    logged = [];

    httpService = {
      get: jest
        .fn()
        .mockReturnValue(of({ data: { timestamp: 1_700_000_000 } })),
    };

    // Логгер молчит в выводе тестов, но всё сказанное собираем: часть проверок
    // — именно про то, что уезжает в лог.
    const collect = (...args: unknown[]) => {
      logged.push(args.map(String).join(' '));
    };
    jest.spyOn(Logger.prototype, 'error').mockImplementation(collect);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(collect);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(collect);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnixtimeService,
        { provide: HttpService, useValue: httpService },
        configProvider({ UNIXTIME_KEY: API_KEY }),
      ],
    }).compile();

    service = module.get(UnixtimeService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    service.onModuleDestroy();
  });

  it('keeps the api key out of the url', async () => {
    await service.onModuleInit();

    const [url, config] = httpService.get.mock.calls[0];
    expect(url).not.toContain(API_KEY);
    expect(config.params).toMatchObject({ key: API_KEY, zone: 'UTC' });
  });

  it('takes the time from the api', async () => {
    await service.onModuleInit();

    // Ответ в секундах, наружу отдаём миллисекунды.
    expect(service.getCurrentUnixtime().unixtime).toBeGreaterThanOrEqual(
      1_700_000_000_000,
    );
  });

  it('falls back to local time when the api is down', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('timezonedb down')),
    );

    await service.onModuleInit();

    expect(service.getCurrentUnixtime().unixtime).toBeCloseTo(Date.now(), -3);
  });

  it('does not write the api key to the log when the request fails', async () => {
    // Дамп ошибки axios тянет за собой config запроса вместе с ключом —
    // проверяем, что в лог уходит только причина.
    httpService.get.mockReturnValue(
      throwError(
        () =>
          new Error(
            `Request failed: https://api.timezonedb.com/v2.1/get-time-zone?key=${API_KEY}&format=json`,
          ),
      ),
    );

    await service.onModuleInit();

    expect(logged.join('\n')).not.toContain(API_KEY);
  });
});
