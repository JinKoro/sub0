import type { ExchangeRatesResponse } from '@subzero/shared';

import { api } from '@/shared/api/client';

export function getExchangeRates(): Promise<ExchangeRatesResponse> {
  return api<ExchangeRatesResponse>('/exchange-rates');
}
