import { Module } from '@nestjs/common';

import { ExchangeRateController } from './exchange-rate.controller';
import { DrizzleExchangeRateRepository } from './exchange-rate.repository';
import { ExchangeRateScheduler } from './exchange-rate.scheduler';
import { ExchangeRateService } from './exchange-rate.service';

const CBR_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';

async function fetchCbrXml(): Promise<string> {
  const res = await fetch(CBR_URL);
  if (!res.ok) throw new Error(`CBR HTTP ${res.status}`);
  return res.text();
}

@Module({
  controllers: [ExchangeRateController],
  providers: [
    DrizzleExchangeRateRepository,
    {
      provide: ExchangeRateService,
      useFactory: (repo: DrizzleExchangeRateRepository) =>
        new ExchangeRateService({
          repo,
          fetchCbrXml,
          now: () => new Date(),
        }),
      inject: [DrizzleExchangeRateRepository],
    },
    ExchangeRateScheduler,
  ],
})
export class ExchangeRateModule {}
