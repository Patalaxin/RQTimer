import { Global, Module } from '@nestjs/common';
import { CleanupRegistryService } from './cleanup-registry.service';
import { CleanupSchedulerService } from './cleanup-scheduler.service';

@Global()
@Module({
  providers: [CleanupRegistryService, CleanupSchedulerService],
  exports: [CleanupRegistryService],
})
export class CleanupModule {}
