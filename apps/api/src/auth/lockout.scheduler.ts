import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { LockoutService } from './lockout.service';

/** Attaches scheduling to the framework-agnostic lockout core. */
@Injectable()
export class LockoutScheduler {
  constructor(private readonly lockout: LockoutService) {}

  // Idempotent DELETE, safe under double-run across replicas (cf.
  // mail-retention) — no advisory lock needed.
  @Cron(CronExpression.EVERY_HOUR, { name: 'login-attempt-retention' })
  retention(): Promise<void> {
    return this.lockout.runRetention();
  }
}
