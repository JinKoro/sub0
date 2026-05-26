import { Currency } from '@subzero/shared';

import { useCabinet } from '@/shared/contexts/cabinet-context';
import { useExchangeRates } from '@/shared/contexts/exchange-rates-context';
import { curSymbol } from '@/shared/constants/cabinet';

const CAB_CUR_TO_ENUM: Record<string, number> = {
  RUB: Currency.RUB,
  USD: Currency.USD,
  EUR: Currency.EUR,
  BYN: Currency.BYN,
};

export function useFormatRub() {
  const { currency } = useCabinet();
  const { rates } = useExchangeRates();
  const sym = curSymbol(currency);
  const targetRate = rates[CAB_CUR_TO_ENUM[currency] ?? Currency.RUB] ?? 1;
  return (rub: number) => {
    const val = Math.round(rub / targetRate);
    const spaced = String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return spaced + ' ' + sym;
  };
}
