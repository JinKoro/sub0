import { SubscriptionState } from '@subzero/shared';

import { addPeriod } from './billing-cycle';
import { resolveCurrentPrice } from './promo-resolver';
import type {
  DueSubscription,
  SubscriptionCycleRepository,
} from './subscription-cycle.types';

const DEFAULT_BATCH_SIZE = 200;

export interface SubscriptionCycleServiceDeps {
  repo: SubscriptionCycleRepository;
  now: () => Date;
  generateBilSku: () => string;
}

export interface CycleTickResult {
  /** Сколько подписок забрал за тик. */
  considered: number;
  /** Сколько ACTIVE-подписок сгенерировали запись в billing_history. */
  billed: number;
  /** Сколько CANCELLED-подписок перешли в ARCHIVED. */
  archived: number;
  /** Сколько пропущено из-за устаревшего version (другой воркер). */
  skipped: number;
}

/** Worker биллинг-цикла. Идемпотентен по дизайну:
 *  - после `tickActive` `next_billing_date` уезжает в будущее, следующий
 *    батч ту же подписку не подхватит;
 *  - `tickCancelled` переводит state в ARCHIVED, который из выборки выпадает.
 *  Защита от race с другой репликой воркера — optimistic locking по `version`. */
export class SubscriptionCycleService {
  private readonly repo: SubscriptionCycleRepository;
  private readonly now: () => Date;
  private readonly generateBilSku: () => string;

  constructor(deps: SubscriptionCycleServiceDeps) {
    this.repo = deps.repo;
    this.now = deps.now;
    this.generateBilSku = deps.generateBilSku;
  }

  async tick(batchSize: number = DEFAULT_BATCH_SIZE): Promise<CycleTickResult> {
    const now = this.now();
    const due = await this.repo.findDue(now, batchSize);

    let billed = 0;
    let archived = 0;
    let skipped = 0;

    for (const sub of due) {
      if (sub.stateId === SubscriptionState.ACTIVE) {
        const ok = await this.tickActive(sub);
        if (ok) billed += 1;
        else skipped += 1;
      } else if (sub.stateId === SubscriptionState.CANCELLED) {
        const ok = await this.repo.tickCancelled({
          subscriptionId: sub.id,
          version: sub.version,
        });
        if (ok) archived += 1;
        else skipped += 1;
      }
    }

    return { considered: due.length, billed, archived, skipped };
  }

  private async tickActive(sub: DueSubscription): Promise<boolean> {
    const periodEnd = sub.nextBillingDate;
    const periodStart = addPeriod(periodEnd, sub.billingPeriodId, -1);
    // Цена на момент списания: минимальный активный promo, иначе обычная сумма.
    const resolved = resolveCurrentPrice(sub.amount, sub.promos, periodEnd);
    const newNext = addPeriod(periodEnd, sub.billingPeriodId, 1);

    return this.repo.tickActive({
      subscriptionId: sub.id,
      customerId: sub.customerId,
      projectId: sub.projectId,
      version: sub.version,
      billing: {
        sku: this.generateBilSku(),
        periodStart,
        periodEnd,
        billedAt: this.now(),
        amount: resolved.amount,
        currencyId: sub.currencyId,
        isPromo: resolved.isPromo,
      },
      newNextBillingDate: newNext,
    });
  }
}
