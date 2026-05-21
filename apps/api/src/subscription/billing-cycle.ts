import { BillingPeriod } from '@subzero/shared';

const MAX_BACKFILL_CYCLES = { [BillingPeriod.MONTH]: 24, [BillingPeriod.YEAR]: 2 } as const;

export function addPeriod(from: Date, period: BillingPeriod, n: number): Date {
  const d = new Date(from.getTime());
  if (period === BillingPeriod.MONTH) {
    d.setUTCMonth(d.getUTCMonth() + n);
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + n);
  }
  return d;
}

export function countElapsedCycles(
  firstBillingDate: Date,
  period: BillingPeriod,
  now: Date,
): number {
  if (firstBillingDate >= now) return 0;
  let n = 0;
  while (addPeriod(firstBillingDate, period, n + 1) <= now) n += 1;
  return Math.min(n, MAX_BACKFILL_CYCLES[period]);
}

export function nextBillingDateAfter(
  firstBillingDate: Date,
  period: BillingPeriod,
  now: Date,
): Date {
  if (firstBillingDate >= now) return new Date(firstBillingDate.getTime());
  let n = 1;
  while (addPeriod(firstBillingDate, period, n) < now) n += 1;
  return addPeriod(firstBillingDate, period, n);
}

export interface BackfillEntry {
  periodStart: Date;
  periodEnd: Date;
  billedAt: Date;
  amount: string;
  isPromo: boolean;
}

export function computeBackfill(args: {
  firstBillingDate: Date;
  billingPeriod: BillingPeriod;
  amount: string;
  promoAmount: string | null;
  promoEndsAt: Date | null;
  now: Date;
}): BackfillEntry[] {
  const cycles = countElapsedCycles(args.firstBillingDate, args.billingPeriod, args.now);
  const out: BackfillEntry[] = [];
  for (let i = 0; i < cycles; i += 1) {
    const periodStart = addPeriod(args.firstBillingDate, args.billingPeriod, i);
    const periodEnd = addPeriod(args.firstBillingDate, args.billingPeriod, i + 1);
    const inPromo =
      args.promoAmount !== null &&
      args.promoEndsAt !== null &&
      periodEnd <= args.promoEndsAt;
    out.push({
      periodStart,
      periodEnd,
      billedAt: periodEnd,
      amount: inPromo ? (args.promoAmount as string) : args.amount,
      isPromo: inPromo,
    });
  }
  return out;
}
