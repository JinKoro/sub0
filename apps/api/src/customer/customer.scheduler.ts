import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CustomerService } from './customer.service';

/** Attaches scheduling to the framework-agnostic customer core. */
@Injectable()
export class CustomerScheduler {
  constructor(private readonly customers: CustomerService) {}

  // 152-ФЗ grace tail. Idempotent DELETE, safe under double-run across
  // replicas (cf. mail-retention) — no advisory lock needed.
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'customer-hard-delete' })
  hardDelete(): Promise<void> {
    return this.customers.runHardDeleteRetention();
  }
}
