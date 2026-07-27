import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { catchError, lastValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IUnixtime } from './unixtime.interface';
import { EnvironmentVariables } from '../config/env.validation';
import { redactSecrets } from '../utils/redact';

@Injectable()
export class UnixtimeService
  implements OnModuleInit, OnModuleDestroy, IUnixtime
{
  private readonly logger = new Logger(UnixtimeService.name);

  private unixtime: number = Date.now();
  private lastSyncTime: number = Date.now();
  private syncInterval: NodeJS.Timeout;

  private readonly REQUEST_TIMEOUT = 5000; // 5 секунд

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onModuleInit() {
    await this.syncUnixtimeFromApi();

    this.syncInterval = setInterval(() => {
      // Метод гасит свои ошибки сам и откатывается на локальное время.
      void this.syncUnixtimeFromApi();
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  private async syncUnixtimeFromApi() {
    const start = Date.now();
    try {
      const response = await lastValueFrom(
        this.httpService
          .get('https://api.timezonedb.com/v2.1/get-time-zone', {
            // Ключ параметром, а не внутри строки URL: иначе он оседает в
            // config.url и уезжает в лог с каждым стектрейсом axios.
            params: {
              key: this.config.get('UNIXTIME_KEY', { infer: true }),
              format: 'json',
              by: 'zone',
              zone: 'UTC',
            },
          })
          .pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError((error) => {
              // Логируем причину, а не объект ошибки: дамп axios тянет за
              // собой весь конфиг запроса вместе с ключом.
              this.logger.error(
                redactSecrets(
                  `Не удалось получить время из API: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                ),
              );
              throw error;
            }),
          ),
      );

      const end = Date.now();
      const apiUnixtime = response.data.timestamp * 1000;
      const processingTimeMs = end - start;

      this.unixtime = apiUnixtime + processingTimeMs;
      this.lastSyncTime = Date.now();

      this.logger.debug(
        `Synced unixtime: ${this.unixtime}, processingTime: ${processingTimeMs}ms`,
      );
    } catch {
      this.logger.warn('Using local time due to error');
      this.unixtime = Date.now();
      this.lastSyncTime = Date.now();
    }
  }

  getCurrentUnixtime(): { unixtime: number } {
    const time = this.unixtime + (Date.now() - this.lastSyncTime);
    return { unixtime: time };
  }
}
