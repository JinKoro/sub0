'use client';

import { useEffect } from 'react';
import type { CabinetCurrency } from '@/entities/subscription/model/cabinet-types';
import { useCabinet } from './cabinet-context';
import { useLang } from './lang-context';
import { useProfile } from './profile-context';

const ID_TO_CUR: Record<number, CabinetCurrency> = { 1: 'RUB', 2: 'USD', 3: 'EUR', 4: 'BYN' };

/**
 * Aligns the global lang/currency contexts with the server profile so the
 * header and Settings never diverge. Re-runs when the profile changes
 * (e.g. after saving preferences). Renders nothing.
 */
export function ProfileSync() {
  const { profile } = useProfile();
  const { lang, toggle } = useLang();
  const { currency, setCurrency } = useCabinet();
  const localeId = profile?.localeId;
  const currencyId = profile?.currencyId;

  useEffect(() => {
    if (localeId === undefined) return;
    const serverLang = localeId === 2 ? 'en' : 'ru';
    if (serverLang !== lang) toggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localeId]);

  useEffect(() => {
    if (currencyId === undefined) return;
    const cur = ID_TO_CUR[currencyId];
    if (cur && cur !== currency) setCurrency(cur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyId]);

  return null;
}
