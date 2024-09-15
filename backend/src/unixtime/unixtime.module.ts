import { Module } from '@nestjs/common';
import { UnixtimeController } from './unixtime.controller';
import { UnixtimeService } from './unixtime.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [UnixtimeController],
  providers: [
    UnixtimeService,
    { provide: 'IUnixtime', useClass: UnixtimeService },
  ],
  exports: [UnixtimeService],
})
export class UnixtimeModule {}
