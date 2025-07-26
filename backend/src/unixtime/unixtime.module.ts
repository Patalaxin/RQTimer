import { Module } from '@nestjs/common';
import { UnixtimeController } from './unixtime.controller';
import { UnixtimeService } from './unixtime.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [UnixtimeController],
  providers: [
    {
      provide: 'IUnixtime',
      useClass: UnixtimeService,
    },
  ],
  exports: ['IUnixtime'],
})
export class UnixtimeModule {}
