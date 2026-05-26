import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Currency } from '@subzero/shared';

import { ExchangeRateService } from './exchange-rate.service';
import type { ExchangeRateRepository } from './exchange-rate.types';

const SAMPLE = readFileSync(join(__dirname, '__fixtures__', 'cbr-sample.xml'), 'utf8');

function makeRepo(): jest.Mocked<ExchangeRateRepository> {
  return {
    list: jest.fn(),
    upsertMany: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ExchangeRateService.pullAndUpsert', () => {
  it('сохраняет только supported (USD/EUR/BYN), игнорирует прочие', async () => {
    const repo = makeRepo();
    const svc = new ExchangeRateService({
      repo,
      fetchCbrXml: async () => SAMPLE,
      now: () => new Date('2026-06-02T08:00:00Z'),
    });
    const { inserted } = await svc.pullAndUpsert();
    expect(inserted).toBe(3);
    const rows = repo.upsertMany.mock.calls[0]![0];
    const byCurrency = Object.fromEntries(rows.map((r) => [r.currencyId, r.rate]));
    expect(byCurrency[Currency.USD]).toBe('78.50310000');
    expect(byCurrency[Currency.EUR]).toBe('91.12340000');
    expect(byCurrency[Currency.BYN]).toBe('27.85000000');
    expect(byCurrency[Currency.RUB]).toBeUndefined(); // RUB не в XML, добавляется на чтении
  });
});

describe('ExchangeRateService.getRates', () => {
  const now = new Date('2026-06-02T12:00:00Z');

  it('добавляет RUB=1 синтетически + не помечает stale при свежих данных', async () => {
    const repo = makeRepo();
    repo.list.mockResolvedValue([
      {
        currencyId: Currency.USD,
        rate: '78.50310000',
        sourceAt: new Date('2026-06-01T00:00:00Z'),
        fetchedAt: new Date('2026-06-01T12:00:00Z'),
      },
    ]);
    const svc = new ExchangeRateService({
      repo,
      fetchCbrXml: async () => SAMPLE,
      now: () => now,
    });
    const res = await svc.getRates();
    expect(res.stale).toBe(false);
    expect(res.rates[0]).toMatchObject({ currencyId: Currency.RUB, rate: '1.00000000' });
    expect(res.rates.find((r) => r.currencyId === Currency.USD)).toBeTruthy();
  });

  it('помечает stale=true когда хоть один курс старше 48ч', async () => {
    const repo = makeRepo();
    repo.list.mockResolvedValue([
      {
        currencyId: Currency.USD,
        rate: '78.50',
        // 3 дня назад
        sourceAt: new Date('2026-05-30T00:00:00Z'),
        fetchedAt: new Date('2026-05-30T12:00:00Z'),
      },
    ]);
    const svc = new ExchangeRateService({
      repo,
      fetchCbrXml: async () => SAMPLE,
      now: () => now,
    });
    const res = await svc.getRates();
    expect(res.stale).toBe(true);
  });

  it('пустой БД — отдаёт только RUB, stale=false', async () => {
    const repo = makeRepo();
    repo.list.mockResolvedValue([]);
    const svc = new ExchangeRateService({
      repo,
      fetchCbrXml: async () => SAMPLE,
      now: () => now,
    });
    const res = await svc.getRates();
    expect(res.stale).toBe(false);
    expect(res.rates).toHaveLength(1);
    expect(res.rates[0]!.currencyId).toBe(Currency.RUB);
  });
});
