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

  /** Один прогон: находит candidates на сегодня и идемпотентно ставит в outbox. */
  async runDailyTick(): Promise<{ enqueued: number; candidates: number }> {
    const today = startOfUtcDay(this.now());
    const candidates = await this.repo.findUpcomingChargeCandidates(today);
    const enqueued = await this.repo.enqueueIdempotent(candidates);
    return { enqueued, candidates: candidates.length };
  }
}

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
