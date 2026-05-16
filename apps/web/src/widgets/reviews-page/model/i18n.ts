type Lang = 'ru' | 'en';

export function resolveI18n(value: string | { ru: string; en: string }, lang: Lang): string {
  if (typeof value === 'string') return value;
  return value[lang];
}
