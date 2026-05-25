'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Currency } from '@subzero/shared';

import { getExchangeRates } from '@/entities/exchange-rate/api/get';

/** Карта currencyId → курс RUB за 1 единицу. RUB присутствует с rate=1. */
export type RateMap = Record<number, number>;

interface ExchangeRatesCtx {
  rates: RateMap;
  /** true если самый старый из курсов старше 48 часов. UI показывает предупреждение. */
  stale: boolean;
  loading: boolean;
}

const FALLBACK_RATES: RateMap = {
  [Currency.RUB]: 1,
  [Currency.USD]: 92,
  [Currency.EUR]: 100,
  [Currency.BYN]: 28,
};

const Ctx = createContext<ExchangeRatesCtx>({
  rates: FALLBACK_RATES,
  stale: true,
  loading: true,
});

export function ExchangeRatesProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState<RateMap>(FALLBACK_RATES);
  const [stale, setStale] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getExchangeRates()
      .then((res) => {
        if (!alive) return;
        const map: RateMap = { [Currency.RUB]: 1 };
        for (const r of res.rates) map[r.currencyId] = Number(r.rate);
        setRates(map);
        setStale(res.stale);
      })
      .catch(() => {
        // молча падаем на FALLBACK — analytics не критична для работы кабинета
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ rates, stale, loading }), [rates, stale, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExchangeRates(): ExchangeRatesCtx {
  return useContext(Ctx);
}

/** Конвертирует price из валюты `fromCur` (Currency enum) в RUB по текущим курсам. */
export function convertToRub(price: number, fromCur: number, rates: RateMap): number {
  const rate = rates[fromCur] ?? 1;
  return price * rate;
}

/** Конвертирует price из валюты `fromCur` в `toCur`. */
export function convertCurrency(
  price: number,
  fromCur: number,
  toCur: number,
  rates: RateMap,
): number {
  const rub = convertToRub(price, fromCur, rates);
  const toRate = rates[toCur] ?? 1;
  return rub / toRate;
}

const CAB_CUR_TO_ENUM: Record<string, number> = {
  RUB: Currency.RUB,
  USD: Currency.USD,
  EUR: Currency.EUR,
  BYN: Currency.BYN,
};

/** Хук-обёртка для существующих компонентов: возвращает функцию (price, 'USD') → RUB по живым курсам. */
export function useToRub(): (price: number, cur: string) => number {
  const { rates } = useExchangeRates();
  return (price, cur) => convertToRub(price, CAB_CUR_TO_ENUM[cur] ?? Currency.RUB, rates);
}
