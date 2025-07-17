import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { catchError, lastValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as process from 'node:process';
import { IUnixtime } from './unixtime.interface';

@Injectable()
export class UnixtimeService
  implements OnModuleInit, OnModuleDestroy, IUnixtime
{
  private readonly logger = new Logger(UnixtimeService.name);

  private unixtime: number = Date.now();
  private lastSyncTime: number = Date.now();
  private syncInterval: NodeJS.Timeout;

  private readonly REQUEST_TIMEOUT = 5000; // 5 секунд

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    await this.syncUnixtimeFromApi();

    this.syncInterval = setInterval(() => {
      this.syncUnixtimeFromApi();
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
          .get(
            `https://api.timezonedb.com/v2.1/get-time-zone?key=${process.env.UNIXTIME_KEY}&format=json&by=zone&zone=UTC`,
          )
          .pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError((error) => {
              this.logger.error('Failed to get unixtime from API', error);
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
