'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';
import type { SubscriptionDto } from '@subzero/shared';

import { listSubscriptions } from '@/shared/api/subscription';
import { convertToRub, type RateMap } from '@/shared/contexts/exchange-rates-context';

interface SubscriptionsCtx {
  items: SubscriptionDto[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SubscriptionsCtx>({
  items: [],
  loading: true,
  error: null,
  refresh: async () => {},
});

const PAGE_SIZE = 100;

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SubscriptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const acc: SubscriptionDto[] = [];
      let page = 1;
      for (;;) {
        const res = await listSubscriptions({
          projectSku: 'all',
          status: 'all',
          page,
          pageSize: PAGE_SIZE,
        });
        acc.push(...res.items);
        if (acc.length >= res.total || res.items.length === 0) break;
        page += 1;
        if (page > 50) break;
      }
      setItems(acc);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ items, loading, error, refresh }), [items, loading, error, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSubscriptions(): SubscriptionsCtx {
  return useContext(Ctx);
}

/** PAUSED / ARCHIVED исключаются из totals и календаря.
 *  CANCELLED остаётся в календаре до nextBillingDate (см. roadmap MVP). */
export function isLive(s: SubscriptionDto): boolean {
  return s.stateId === SubscriptionState.ACTIVE || s.stateId === SubscriptionState.CANCELLED;
}

/** Активный промо: endsAt > now, минимальный amount. Если нет — null. */
export function activePromoAmount(s: SubscriptionDto, now: Date): number | null {
  let best: number | null = null;
  for (const p of s.promos) {
    if (new Date(p.endsAt) <= now) continue;
    const a = Number(p.amount);
    if (best === null || a < best) best = a;
  }
  return best;
}

/** Цена подписки на момент `now` с учётом активного промо. */
export function currentAmount(s: SubscriptionDto, now: Date): number {
  return activePromoAmount(s, now) ?? Number(s.amount);
}

/** Сумма в рублях, нормализованная к месяцу (YEAR /12). */
export function monthlyRub(s: SubscriptionDto, rates: RateMap, now: Date): number {
  const amount = currentAmount(s, now);
  const rub = convertToRub(amount, s.currencyId, rates);
  return s.billingPeriodId === BillingPeriod.YEAR ? rub / 12 : rub;
}

/** Сумма в рублях за одно списание (без нормализации к месяцу). */
export function chargeRub(s: SubscriptionDto, rates: RateMap, now: Date): number {
  return convertToRub(currentAmount(s, now), s.currencyId, rates);
}

/** Все occurrences подписки в [from..to] включительно, выведенные из nextBillingDate
 *  по cycle (MONTHLY = каждый месяц в тот же день; YEARLY = раз в год в эту дату).
 *  Для CANCELLED оставляем только до nextBillingDate (включительно). */
export function occurrencesInRange(s: SubscriptionDto, from: Date, to: Date): Date[] {
  if (!isLive(s)) return [];
  const next = new Date(s.nextBillingDate);
  if (Number.isNaN(next.getTime())) return [];

  const out: Date[] = [];
  const isCancelled = s.stateId === SubscriptionState.CANCELLED;
  // Идём вперёд от nextBillingDate. Для cancelled — только один тик (он и так финальный).
  const step = (d: Date): Date => {
    const x = new Date(d);
    if (s.billingPeriodId === BillingPeriod.YEAR) x.setFullYear(x.getFullYear() + 1);
    else x.setMonth(x.getMonth() + 1);
    return x;
  };

  let cur = next;
  let guard = 0;
  while (cur <= to && guard < 1000) {
    if (cur >= from) out.push(new Date(cur));
    if (isCancelled) break;
    cur = step(cur);
    guard += 1;
  }
  return out;
}

/** Инициалка для LogoPill: первый видимый символ name uppercased. */
export function subChar(s: { name: string }): string {
  const c = s.name.trim().charAt(0);
  return c ? c.toUpperCase() : '·';
}

/** Маппер cabinet-currency ('RUB'/'USD'/...) → enum. */
export function curToEnum(cur: string): Currency {
  switch (cur) {
    case 'USD':
      return Currency.USD;
    case 'EUR':
      return Currency.EUR;
    case 'BYN':
      return Currency.BYN;
    default:
      return Currency.RUB;
  }
}
