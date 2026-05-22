import { BillingPeriod } from '@subzero/shared';

import {
  addPeriod,
  computeBackfill,
  countElapsedCycles,
  nextBillingDateAfter,
} from './billing-cycle';

describe('addPeriod', () => {
  it('+1 month', () => {
    expect(addPeriod(new Date('2026-01-15T00:00:00Z'), BillingPeriod.MONTH, 1)).toEqual(
      new Date('2026-02-15T00:00:00Z'),
    );
  });
  it('+12 months across year boundary', () => {
    expect(addPeriod(new Date('2026-01-15T00:00:00Z'), BillingPeriod.MONTH, 12)).toEqual(
      new Date('2027-01-15T00:00:00Z'),
    );
  });
  it('+1 year', () => {
    expect(addPeriod(new Date('2026-01-15T00:00:00Z'), BillingPeriod.YEAR, 1)).toEqual(
      new Date('2027-01-15T00:00:00Z'),
    );
  });
});

describe('countElapsedCycles', () => {
  const now = new Date('2026-05-21T00:00:00Z');
  it('0 cycles for future first date', () => {
    expect(
      countElapsedCycles(new Date('2026-06-01T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toBe(0);
  });
  it('exact past', () => {
    expect(
      countElapsedCycles(new Date('2026-03-21T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toBe(2);
  });
  it('caps at 24 months', () => {
    expect(
      countElapsedCycles(new Date('2020-01-01T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toBe(24);
  });
  it('caps at 2 years for YEAR period', () => {
    expect(
      countElapsedCycles(new Date('2020-01-01T00:00:00Z'), BillingPeriod.YEAR, now),
    ).toBe(2);
  });
});

describe('nextBillingDateAfter', () => {
  const now = new Date('2026-05-21T00:00:00Z');
  it('future first date — kept as-is', () => {
    expect(
      nextBillingDateAfter(new Date('2026-06-01T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toEqual(new Date('2026-06-01T00:00:00Z'));
  });
  it('past first date — first slot ≥ now', () => {
    expect(
      nextBillingDateAfter(new Date('2026-01-15T00:00:00Z'), BillingPeriod.MONTH, now),
    ).toEqual(new Date('2026-06-15T00:00:00Z'));
  });
});

describe('computeBackfill', () => {
  const now = new Date('2026-05-21T00:00:00Z');

  it('promo применяется когда активен в момент billedAt (periodEnd)', () => {
    const out = computeBackfill({
      firstBillingDate: new Date('2026-02-21T00:00:00Z'),
      billingPeriod: BillingPeriod.MONTH,
      amount: '500.00',
      promos: [{ amount: '0.00', endsAt: new Date('2026-04-30T00:00:00Z') }],
      now,
    });
    expect(out).toHaveLength(3);
    expect(out[0].isPromo).toBe(true);   // billedAt 2026-03-21 < 2026-04-30
    expect(out[1].isPromo).toBe(true);   // billedAt 2026-04-21 < 2026-04-30
    expect(out[2].isPromo).toBe(false);  // billedAt 2026-05-21 > 2026-04-30
    expect(out[2].amount).toBe('500.00');
  });

  it('без промо — full price на все циклы', () => {
    const out = computeBackfill({
      firstBillingDate: new Date('2026-03-21T00:00:00Z'),
      billingPeriod: BillingPeriod.MONTH,
      amount: '300.00',
      promos: [],
      now,
    });
    expect(out).toHaveLength(2);
    expect(out.every((e) => !e.isPromo)).toBe(true);
    expect(out.every((e) => e.amount === '300.00')).toBe(true);
  });

  it('несколько промо — берётся минимальный активный', () => {
    const out = computeBackfill({
      firstBillingDate: new Date('2026-03-21T00:00:00Z'),
      billingPeriod: BillingPeriod.MONTH,
      amount: '500.00',
      promos: [
        { amount: '300.00', endsAt: new Date('2026-06-30T00:00:00Z') },
        { amount: '100.00', endsAt: new Date('2026-06-30T00:00:00Z') },
      ],
      now,
    });
    expect(out).toHaveLength(2);
    expect(out[0].amount).toBe('100.00');
    expect(out[1].amount).toBe('100.00');
  });
});
