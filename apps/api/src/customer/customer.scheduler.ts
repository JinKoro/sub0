import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CustomerService } from './customer.service';

/** Attaches scheduling to the framework-agnostic customer core. */
@Injectable()
export class CustomerScheduler {
  private readonly log = new Logger(CustomerScheduler.name);

  constructor(private readonly customers: CustomerService) {}

  // 152-ФЗ grace tail. Idempotent DELETE, safe under double-run across
  // replicas (cf. mail-retention) — no advisory lock needed.
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'customer-hard-delete' })
  hardDelete(): Promise<void> {
    return this.customers.runHardDeleteRetention();
  }

  // Возврат PRO в FREE по истечении plan_expires_at. После UPDATE
  // подходящих строк больше нет — double-run на второй реплике безопасен.
  // Точность сутки роли не играет, поэтому раз в час с запасом.
  @Cron(CronExpression.EVERY_HOUR, { name: 'customer-plan-expiry' })
  async planExpiry(): Promise<void> {
    try {
      const n = await this.customers.runPlanExpiry();
      if (n > 0) this.log.log(`plan-expiry: ${n} customer(s) downgraded to FREE`);
    } catch (e) {
      this.log.warn(`plan-expiry failed: ${(e as Error).message}`);
    }
  }
}
