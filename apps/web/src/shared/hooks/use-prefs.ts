'use client';

import type { CabinetCurrency } from '@/entities/subscription/model/cabinet-types';
import { useCabinet } from '@/shared/contexts/cabinet-context';
import { useLang } from '@/shared/contexts/lang-context';
import { useProfile } from '@/shared/contexts/profile-context';

// shared enums: Locale RU=1/EN=2, Currency RUB=1/USD=2/EUR=3/BYN=4.
const LOCALE_ID: Record<'ru' | 'en', number> = { ru: 1, en: 2 };
export const CUR_TO_ID: Record<CabinetCurrency, number> = { RUB: 1, USD: 2, EUR: 3, BYN: 4 };

/**
 * Language/currency changed from the header: flip the live context for
 * instant UI *and* persist it to the backend (single source of truth —
 * the same `savePreferences` Settings uses).
 */
export function usePrefs() {
  const { lang, toggle } = useLang();
  const { setCurrency } = useCabinet();
  const { savePref } = useProfile();

  const setLang = (l: 'ru' | 'en') => {
    if (lang !== l) toggle();
    void savePref({ localeId: LOCALE_ID[l] });
  };

  const setCurrencyPref = (c: CabinetCurrency) => {
    setCurrency(c);
    void savePref({ currencyId: CUR_TO_ID[c] });
  };

  return { setLang, setCurrency: setCurrencyPref };
}
