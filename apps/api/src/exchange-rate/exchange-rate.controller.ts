import { Controller, Get, HttpCode } from '@nestjs/common';
import type { ExchangeRatesResponse } from '@subzero/shared';

import { ExchangeRateService } from './exchange-rate.service';

@Controller('exchange-rates')
export class ExchangeRateController {
  constructor(private readonly svc: ExchangeRateService) {}

  @Get()
  @HttpCode(200)
  rates(): Promise<ExchangeRatesResponse> {
    return this.svc.getRates();
  }
}
