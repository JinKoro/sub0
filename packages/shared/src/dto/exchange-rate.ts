import type { Currency } from '../enums';

/**
 * Курс валюты относительно RUB. `rate` — сколько RUB за 1 единицу `currencyId`.
 * Для RUB→RUB всегда rate = 1.
 */
export interface ExchangeRateDto {
  currencyId: Currency;
  rate: string;
  sourceAt: string;
  fetchedAt: string;
}

export interface ExchangeRatesResponse {
  /** Карта currency → rate. Включает RUB с rate=1 для удобства FE. */
  rates: ExchangeRateDto[];
  /** true если хоть один курс старше 48 часов (UI должен показать значок). */
  stale: boolean;
}
