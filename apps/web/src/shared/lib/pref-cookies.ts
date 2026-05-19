import type { CabinetCurrency } from '@/entities/subscription/model/cabinet-types';

// Non-sensitive UI prefs. Read server-side in layouts (next/headers) to seed
// providers so the first paint already matches the user — no ru/RUB flash.
export const LANG_COOKIE = 'sub0_lang';
export const CUR_COOKIE = 'sub0_cur';

const ONE_YEAR = 60 * 60 * 24 * 365;

function write(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function writeLangCookie(lang: 'ru' | 'en'): void {
  write(LANG_COOKIE, lang);
}

export function writeCurrencyCookie(cur: CabinetCurrency): void {
  write(CUR_COOKIE, cur);
}

export function parseLang(raw: string | undefined): 'ru' | 'en' {
  return raw === 'en' ? 'en' : 'ru';
}

export function parseCurrency(raw: string | undefined): CabinetCurrency {
  return raw === 'USD' || raw === 'EUR' || raw === 'BYN' ? raw : 'RUB';
}
