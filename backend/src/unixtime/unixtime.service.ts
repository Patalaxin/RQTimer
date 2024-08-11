import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { catchError, lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { UnixtimeResponseDto } from './dto/get-unixtime.dto';

@Injectable()
export class UnixtimeService {
  constructor(private readonly httpService: HttpService) {}

  async getUnixTime(): Promise<UnixtimeResponseDto> {
    const start = Date.now();

    try {
      const response = await lastValueFrom(
        this.httpService
          .get('http://worldtimeapi.org/api/timezone/Etc/UTC')
          .pipe(
            catchError((error) => {
              throw new HttpException(
                `Failed to fetch time from external API: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      const end = Date.now();

      const apiUnixTime = response.data.unixtime;
      const processingTime = Math.floor((end - start) / 1000);

      const correctedUnixTime = apiUnixTime - processingTime;

      return { unixTime: correctedUnixTime };
    } catch (error) {
      throw new HttpException(
        `An error occurred while processing the request: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
