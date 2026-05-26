import { Currency, type ExchangeRatesResponse } from '@subzero/shared';

import { parseCbrXml } from './cbr-parser';
import type { ExchangeRateRepository } from './exchange-rate.types';

const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000;

const SUPPORTED_BY_CHAR: Record<string, Currency> = {
  USD: Currency.USD,
  EUR: Currency.EUR,
  BYN: Currency.BYN,
};

export interface ExchangeRateServiceDeps {
  repo: ExchangeRateRepository;
  /** В тестах подменяем на фикстуру; в проде дергает cbr.ru. */
  fetchCbrXml: () => Promise<string>;
  now: () => Date;
}

export class ExchangeRateService {
  private readonly repo: ExchangeRateRepository;
  private readonly fetchCbrXml: () => Promise<string>;
  private readonly now: () => Date;

  constructor(deps: ExchangeRateServiceDeps) {
    this.repo = deps.repo;
    this.fetchCbrXml = deps.fetchCbrXml;
    this.now = deps.now;
  }

  /** Тянет XML с ЦБ, парсит и сохраняет supported валюты (USD/EUR/BYN). */
  async pullAndUpsert(): Promise<{ inserted: number }> {
    const xml = await this.fetchCbrXml();
    const { sourceAt, rates } = parseCbrXml(xml);
    const fetchedAt = this.now();
    const rows = rates
      .filter((r) => SUPPORTED_BY_CHAR[r.charCode] !== undefined)
      .map((r) => ({
        currencyId: SUPPORTED_BY_CHAR[r.charCode]!,
        rate: r.rate.toFixed(8),
        sourceAt,
        fetchedAt,
      }));
    await this.repo.upsertMany(rows);
    return { inserted: rows.length };
  }

  async getRates(): Promise<ExchangeRatesResponse> {
    const rows = await this.repo.list();
    const now = this.now();
    let stale = false;
    const rates = rows.map((r) => {
      const isStale = now.getTime() - r.sourceAt.getTime() > STALE_THRESHOLD_MS;
      if (isStale) stale = true;
      return {
        currencyId: r.currencyId as Currency,
        rate: r.rate,
        sourceAt: r.sourceAt.toISOString(),
        fetchedAt: r.fetchedAt.toISOString(),
      };
    });
    // RUB всегда 1:1 — добавляем синтетически (не храним в БД).
    rates.unshift({
      currencyId: Currency.RUB,
      rate: '1.00000000',
      sourceAt: now.toISOString(),
      fetchedAt: now.toISOString(),
    });
    return { rates, stale };
  }
}
