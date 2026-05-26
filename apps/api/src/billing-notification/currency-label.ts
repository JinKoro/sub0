import { Currency } from '@subzero/shared';

/** Символы валют для текста письма. RU/EN одинаково. */
export const CURRENCY_LABEL: Record<number, string> = {
  [Currency.RUB]: '₽',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.BYN]: 'BYN',
};
