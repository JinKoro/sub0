import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';

import { SubscriptionCycleService } from './subscription-cycle.service';
import type {
  DueSubscription,
  SubscriptionCycleRepository,
} from './subscription-cycle.types';

const SUB_ID = 's0000000-0000-0000-0000-000000000001';
const CUST_ID = 'c0000000-0000-0000-0000-000000000001';
const PROJ_ID = 'p0000000-0000-0000-0000-000000000001';

const NOW = new Date('2026-06-15T00:00:00Z');

function makeRepo(): jest.Mocked<SubscriptionCycleRepository> {
  return {
    findDue: jest.fn().mockResolvedValue([]),
    tickActive: jest.fn().mockResolvedValue(true),
    tickCancelled: jest.fn().mockResolvedValue(true),
  };
}

function makeService(now = NOW) {
  const repo = makeRepo();
  let n = 0;
  const generateBilSku = () => `bil-FAKE${++n}`;
  const service = new SubscriptionCycleService({ repo, now: () => now, generateBilSku });
  return { service, repo };
}

function makeDue(over: Partial<DueSubscription> = {}): DueSubscription {
  return {
    id: SUB_ID,
    customerId: CUST_ID,
    projectId: PROJ_ID,
    amount: '500.00',
    currencyId: Currency.RUB,
    billingPeriodId: BillingPeriod.MONTH,
    nextBillingDate: new Date('2026-06-01T00:00:00Z'),
    stateId: SubscriptionState.ACTIVE,
    version: 5,
    promos: [],
    ...over,
  };
}

describe('SubscriptionCycleService.tick', () => {
  it('пустой батч — no-op', async () => {
    const { service, repo } = makeService();
    const result = await service.tick();
    expect(result).toEqual({ considered: 0, billed: 0, archived: 0, skipped: 0 });
    expect(repo.tickActive).not.toHaveBeenCalled();
    expect(repo.tickCancelled).not.toHaveBeenCalled();
  });

  it('ACTIVE + прошлый next → bil-запись по обычной цене + сдвиг на месяц', async () => {
    const { service, repo } = makeService();
    repo.findDue.mockResolvedValue([makeDue()]);

    const result = await service.tick();

    expect(result.billed).toBe(1);
    expect(repo.tickActive).toHaveBeenCalledTimes(1);
    const args = repo.tickActive.mock.calls[0]![0];
    expect(args.subscriptionId).toBe(SUB_ID);
    expect(args.version).toBe(5);
    expect(args.billing.sku).toMatch(/^bil-/);
    expect(args.billing.amount).toBe('500.00');
    expect(args.billing.isPromo).toBe(false);
    expect(args.billing.currencyId).toBe(Currency.RUB);
    // period_end = next_billing_date = 2026-06-01, period_start = -1 month
    expect(args.billing.periodEnd.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(args.billing.periodStart.toISOString()).toBe('2026-05-01T00:00:00.000Z');
    // new next = +1 month
    expect(args.newNextBillingDate.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(args.billing.billedAt.toISOString()).toBe(NOW.toISOString());
  });

  it('ACTIVE + активный промо → bil-запись по промо-цене (is_promo=true)', async () => {
    const { service, repo } = makeService();
    repo.findDue.mockResolvedValue([
      makeDue({
        promos: [{ amount: '299.00', endsAt: new Date('2026-09-01T00:00:00Z') }],
      }),
    ]);

    await service.tick();
    const args = repo.tickActive.mock.calls[0]![0];
    expect(args.billing.amount).toBe('299.00');
    expect(args.billing.isPromo).toBe(true);
  });

  it('ACTIVE + YEAR cycle → сдвиг на год', async () => {
    const { service, repo } = makeService();
    repo.findDue.mockResolvedValue([
      makeDue({
        billingPeriodId: BillingPeriod.YEAR,
        nextBillingDate: new Date('2026-01-01T00:00:00Z'),
      }),
    ]);

    await service.tick();
    const args = repo.tickActive.mock.calls[0]![0];
    expect(args.billing.periodStart.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(args.billing.periodEnd.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(args.newNextBillingDate.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('CANCELLED + прошлый next → ARCHIVED, без билля', async () => {
    const { service, repo } = makeService();
    repo.findDue.mockResolvedValue([
      makeDue({ stateId: SubscriptionState.CANCELLED }),
    ]);

    const result = await service.tick();

    expect(result.archived).toBe(1);
    expect(result.billed).toBe(0);
    expect(repo.tickActive).not.toHaveBeenCalled();
    expect(repo.tickCancelled).toHaveBeenCalledWith({ subscriptionId: SUB_ID, version: 5 });
  });

  it('skipped счётчик при устаревшем version (false от repo)', async () => {
    const { service, repo } = makeService();
    repo.findDue.mockResolvedValue([
      makeDue(),
      makeDue({ id: 's-other', stateId: SubscriptionState.CANCELLED }),
    ]);
    repo.tickActive.mockResolvedValue(false);
    repo.tickCancelled.mockResolvedValue(false);

    const result = await service.tick();
    expect(result).toEqual({ considered: 2, billed: 0, archived: 0, skipped: 2 });
  });

  it('кастомный batchSize прокидывается в repo.findDue', async () => {
    const { service, repo } = makeService();
    await service.tick(50);
    expect(repo.findDue).toHaveBeenCalledWith(NOW, 50);
  });
});
