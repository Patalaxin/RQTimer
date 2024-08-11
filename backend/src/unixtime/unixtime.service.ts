import { Injectable } from '@nestjs/common';
import { catchError, lastValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { UnixtimeResponseDto } from './dto/get-unixtime.dto';
import * as process from 'node:process';

@Injectable()
export class UnixtimeService {
  private readonly REQUEST_TIMEOUT = 3000;

  constructor(private readonly httpService: HttpService) {}

  async getUnixTime(): Promise<UnixtimeResponseDto> {
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
              return this.handleError(error);
            }),
          ),
      );

      const end = Date.now();
      const apiUnixTime = response.data.timestamp;
      const processingTime = Math.floor((end - start) / 1000);

      const correctedUnixTime = (apiUnixTime + processingTime) * 1000;

      return { unixTime: correctedUnixTime };
    } catch (error) {
      return { unixTime: Date.now() };
    }
  }

  private handleError(error: any): Promise<any> {
    console.error(`Error fetching time from external API: ${error.message}`);
    return Promise.resolve({ data: { timestamp: Date.now() } });
  }
}
