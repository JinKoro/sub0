export interface ExchangeRateRow {
  currencyId: number;
  rate: string;
  sourceAt: Date;
  fetchedAt: Date;
}

export interface ExchangeRateRepository {
  list(): Promise<ExchangeRateRow[]>;
  upsertMany(
    rows: Array<{ currencyId: number; rate: string; sourceAt: Date; fetchedAt: Date }>,
  ): Promise<void>;
}
