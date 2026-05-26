import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { BillingNotificationService } from './billing-notification.service';

/**
 * Идемпотентный обход подписок: для каждой ACTIVE-подписки ACTIVE-кастомера
 * с включёнными нотификациями ставит письмо в outbox при попадании
 * daysUntil(nextBillingDate) в notification_lead_days.
 *
 * Дедупликация через unique index mail_outbox(dedup_key). Двойной запуск
 * (вторая реплика API) не приводит к дублям — INSERT ... ON CONFLICT DO NOTHING.
 */
@Injectable()
export class BillingNotificationScheduler {
  private readonly log = new Logger(BillingNotificationScheduler.name);

  constructor(private readonly svc: BillingNotificationService) {}

  // 09:00 UTC = 12:00 MSK. Учёт customer.timezone отложен до v1.1.
  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'billing-notification' })
  async tick(): Promise<void> {
    try {
      const { enqueued, candidates } = await this.svc.runDailyTick();
      this.log.log(`upcoming-charge: candidates=${candidates}, enqueued=${enqueued}`);
    } catch (e) {
      this.log.warn(`tick failed: ${(e as Error).message}`);
    }
  }
}
