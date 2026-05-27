import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SubscriptionCycleService } from './subscription-cycle.service';

/** Биллинг-cron: каждые 5 минут проходит по подпискам с истёкшим
 *  next_billing_date — ACTIVE генерируют billing_history и сдвигают
 *  next, CANCELLED архивируются. Подробности — `ai/ctx-business-logic.md`
 *  § «Billing history — генерация». */
@Injectable()
export class SubscriptionScheduler {
  private readonly log = new Logger(SubscriptionScheduler.name);

  constructor(private readonly cycle: SubscriptionCycleService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'subscription-billing-cycle' })
  async tick(): Promise<void> {
    try {
      const result = await this.cycle.tick();
      if (result.considered > 0) {
        this.log.log(
          `cycle: considered=${result.considered}, billed=${result.billed}, ` +
            `archived=${result.archived}, skipped=${result.skipped}`,
        );
      }
    } catch (e) {
      this.log.warn(`tick failed: ${(e as Error).message}`);
    }
  }
}
