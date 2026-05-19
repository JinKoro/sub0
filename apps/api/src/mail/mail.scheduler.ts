import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';

import { MailOutboxWorker } from './mail-outbox.worker';

/** Attaches scheduling to the framework-agnostic worker core. */
@Injectable()
export class MailScheduler {
  constructor(private readonly worker: MailOutboxWorker) {}

  @Interval('mail-outbox', 15_000)
  tick(): Promise<void> {
    return this.worker.tick();
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'mail-retention' })
  retention(): Promise<void> {
    return this.worker.runRetention();
  }
}
