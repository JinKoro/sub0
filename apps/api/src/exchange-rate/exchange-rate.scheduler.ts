import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ExchangeRateService } from './exchange-rate.service';

/**
 * Идемпотентный pull курсов с ЦБ. Под второй репликой безопасно: upsert по
 * unique(currency_id) даст одинаковый результат при double-run.
 * ЦБ публикует курсы для следующего рабочего дня обычно в 11:30 MSK (08:30 UTC),
 * поэтому тянем в 12:00 UTC (15:00 MSK) — после публикации с запасом.
 */
@Injectable()
export class ExchangeRateScheduler {
  private readonly log = new Logger(ExchangeRateScheduler.name);

  constructor(private readonly svc: ExchangeRateService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON, { name: 'exchange-rate-pull' })
  async pull(): Promise<void> {
    try {
      const { inserted } = await this.svc.pullAndUpsert();
      this.log.log(`pulled ${inserted} rates from CBR`);
    } catch (err) {
      // ЦБ может быть недоступен — пишем в лог, продолжаем работать на старых данных
      // (стейл-флаг включится автоматически при getRates через 48ч).
      this.log.warn(`CBR pull failed: ${(err as Error).message}`);
    }
  }
}
