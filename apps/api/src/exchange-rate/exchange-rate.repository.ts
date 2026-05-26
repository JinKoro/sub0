import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { exchangeRate } from '../db/schema/exchange-rate';
import type { ExchangeRateRepository, ExchangeRateRow } from './exchange-rate.types';

@Injectable()
export class DrizzleExchangeRateRepository implements ExchangeRateRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(): Promise<ExchangeRateRow[]> {
    return this.db
      .select({
        currencyId: exchangeRate.currencyId,
        rate: exchangeRate.rate,
        sourceAt: exchangeRate.sourceAt,
        fetchedAt: exchangeRate.fetchedAt,
      })
      .from(exchangeRate);
  }

  async upsertMany(
    rows: Array<{ currencyId: number; rate: string; sourceAt: Date; fetchedAt: Date }>,
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.db
      .insert(exchangeRate)
      .values(rows)
      .onConflictDoUpdate({
        target: exchangeRate.currencyId,
        set: {
          rate: sql`excluded.rate`,
          sourceAt: sql`excluded.source_at`,
          fetchedAt: sql`excluded.fetched_at`,
          updatedAt: sql`now()`,
        },
      });
  }
}
