import { NotificationChannelType } from '@subzero/shared';

import type { BillingNotificationRepository } from './billing-notification.types';

export interface BillingNotificationServiceDeps {
  repo: BillingNotificationRepository;
  now: () => Date;
}

export class BillingNotificationService {
  private readonly repo: BillingNotificationRepository;
  private readonly now: () => Date;

  constructor(deps: BillingNotificationServiceDeps) {
    this.repo = deps.repo;
    this.now = deps.now;
  }

  /** Один прогон: находит candidates на сегодня и идемпотентно ставит в
   *  per-channel outbox (mail_outbox / telegram_outbox). */
  async runDailyTick(): Promise<{ enqueued: number; candidates: number }> {
    const today = startOfUtcDay(this.now());
    const candidates = await this.repo.findUpcomingChargeCandidates(today);
    const email = candidates.filter((c) => c.channelTypeId === NotificationChannelType.EMAIL);
    const telegram = candidates.filter(
      (c) => c.channelTypeId === NotificationChannelType.TELEGRAM,
    );
    const enqueued =
      (await this.repo.enqueueEmail(email)) + (await this.repo.enqueueTelegram(telegram));
    return { enqueued, candidates: candidates.length };
  }
}

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
