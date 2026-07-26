import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CleanupRegistryService } from './cleanup-registry.service';

@Injectable()
export class CleanupSchedulerService {
  constructor(private readonly registry: CleanupRegistryService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup(): Promise<void> {
    await this.registry.runAll();
  }
}
