import { Injectable } from '@nestjs/common';
import { catchError, lastValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { UnixtimeResponseDto } from './dto/get-unixtime.dto';
import * as process from 'node:process';
import { IUnixtime } from './unixtime.interface';

@Injectable()
export class UnixtimeService implements IUnixtime {
  private readonly REQUEST_TIMEOUT = 3000;

  constructor(private readonly httpService: HttpService) {}

  async getUnixtime(): Promise<UnixtimeResponseDto> {
    const start = Date.now();

    try {
      const response = await lastValueFrom(
        this.httpService
          .get(
            `https://api.timezonedb.com/v2.1/get-time-zone?key=${process.env.UNIXTIME_KEY}&format=json&by=zone&zone=UTC`,
          )
          .pipe(
            timeout(this.REQUEST_TIMEOUT),
            catchError(() => {
              return this.handleError();
            }),
          ),
      );

      const end = Date.now();
      const apiUnixtime = response.data.timestamp;
      const processingTime = Math.floor((end - start) / 1000);

      const isApiUnixtimeInSeconds = apiUnixtime < 1e12; // Check if it's in seconds or already in milliseconds
      const correctedUnixTime = isApiUnixtimeInSeconds
        ? (apiUnixtime + processingTime) * 1000 // If seconds, convert to milliseconds
        : apiUnixtime + processingTime * 1000; // If already in milliseconds, add processing time in ms

      return { unixtime: correctedUnixTime };
    } catch (error) {
      return { unixtime: Date.now() };
    }
  }

  private handleError(): Promise<any> {
    return Promise.resolve({ data: { timestamp: Date.now() } });
  }
}
