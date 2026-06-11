import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';

import { TelegramOutboxWorker } from './telegram-outbox.worker';

/** Навешивает шедулинг на framework-agnostic воркер (зеркало MailScheduler). */
@Injectable()
export class TelegramScheduler {
  constructor(private readonly worker: TelegramOutboxWorker) {}

  @Interval('telegram-outbox', 15_000)
  tick(): Promise<void> {
    return this.worker.tick();
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'telegram-retention' })
  retention(): Promise<void> {
    return this.worker.runRetention();
  }
}
