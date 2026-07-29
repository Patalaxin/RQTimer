import { Injectable, Logger } from '@nestjs/common';

export type CleanupTask = () => Promise<number | void>;

/**
 * Replaces Mongo's per-collection TTL indexes (there's no equivalent native
 * mechanism in Postgres). Each Prisma-backed module registers its own expired-row
 * deletion here instead of reinventing scheduling/expiry logic per table.
 */
@Injectable()
export class CleanupRegistryService {
  private readonly logger = new Logger(CleanupRegistryService.name);
  private readonly tasks = new Map<string, CleanupTask>();

  register(name: string, task: CleanupTask): void {
    this.tasks.set(name, task);
  }

  async runAll(): Promise<void> {
    for (const [name, task] of this.tasks) {
      try {
        const deletedCount = await task();
        if (deletedCount) {
          this.logger.log(`Cleanup "${name}": removed ${deletedCount} row(s)`);
        }
      } catch (error) {
        this.logger.error(`Cleanup "${name}" failed`, (error as Error).stack);
      }
    }
  }
}
