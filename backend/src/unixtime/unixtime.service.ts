import { Injectable } from '@nestjs/common';
import { catchError, lastValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { UnixtimeResponseDto } from './dto/get-unixtime.dto';
import * as process from 'node:process';

@Injectable()
export class UnixtimeService {
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

      const correctedUnixTime = (apiUnixtime + processingTime) * 1000;

      return { unixtime: correctedUnixTime };
    } catch (error) {
      return { unixtime: Date.now() };
    }
  }

  private handleError(): Promise<any> {
    return Promise.resolve({ data: { timestamp: Date.now() } });
  }
}
