import type { CabinetCurrency } from '@/entities/subscription/model/cabinet-types';

export const CURRENCY_OPTIONS: { id: CabinetCurrency; label: string; labelEn: string; sym: string }[] = [
  { id: 'RUB', label: 'Рос. рубль', labelEn: 'Russian ruble', sym: '₽' },
  { id: 'USD', label: 'Доллар США', labelEn: 'US dollar', sym: '$' },
  { id: 'EUR', label: 'Евро', labelEn: 'Euro', sym: '€' },
  { id: 'BYN', label: 'Бел. рубль', labelEn: 'Belarusian ruble', sym: 'BYN' },
];

export function curSymbol(cur: CabinetCurrency): string {
  if (cur === 'USD') return '$';
  if (cur === 'EUR') return '€';
  if (cur === 'BYN') return 'BYN';
  return '₽';
}

const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthShort(m: number, lang: 'ru' | 'en'): string {
  return (lang === 'en' ? MONTHS_EN : MONTHS_RU)[m] ?? '';
}

const MONTHS_LONG_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const MONTHS_LONG_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLong(m: number, lang: 'ru' | 'en'): string {
  return (lang === 'en' ? MONTHS_LONG_EN : MONTHS_LONG_RU)[m] ?? '';
}

export const STATUS_MAP = {
  active: { ru: 'Активна', en: 'Active', color: '#0a7a3f' },
  paused: { ru: 'На паузе', en: 'Paused', color: '#b0851a' },
  cancel: { ru: 'Отменена', en: 'Canceling', color: '#c94a1c' },
  archive: { ru: 'Архив', en: 'Archive', color: '#6b6b66' },
} as const;

export type StatusKey = keyof typeof STATUS_MAP;

export function fmtPrice(price: number, cur: CabinetCurrency): string {
  if (cur === 'RUB') {
    const spaced = String(Math.round(price)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return spaced + ' ₽';
  }
  return price + ' ' + cur;
}

export const MOCK_USER = {
  initials: 'АК',
  name: 'Анна Климова',
  nameEn: 'Anna Klimova',
  email: 'anna@example.ru',
  plan: 'FREE',
  timezone: 'Europe/Moscow',
  telegramHandle: '@anna_klimova',
};

export interface Timezone {
  id: string;
  label: string;
  offset: string;
}

export const TIMEZONES: Timezone[] = [
  { id: 'Europe/Kaliningrad', label: 'Europe/Kaliningrad', offset: 'GMT+2' },
  { id: 'Europe/Moscow', label: 'Europe/Moscow', offset: 'GMT+3' },
  { id: 'Europe/Samara', label: 'Europe/Samara', offset: 'GMT+4' },
  { id: 'Asia/Yekaterinburg', label: 'Asia/Yekaterinburg', offset: 'GMT+5' },
  { id: 'Asia/Omsk', label: 'Asia/Omsk', offset: 'GMT+6' },
  { id: 'Asia/Novosibirsk', label: 'Asia/Novosibirsk', offset: 'GMT+7' },
  { id: 'Asia/Irkutsk', label: 'Asia/Irkutsk', offset: 'GMT+8' },
  { id: 'Asia/Yakutsk', label: 'Asia/Yakutsk', offset: 'GMT+9' },
  { id: 'Asia/Vladivostok', label: 'Asia/Vladivostok', offset: 'GMT+10' },
  { id: 'Asia/Magadan', label: 'Asia/Magadan', offset: 'GMT+11' },
  { id: 'Asia/Kamchatka', label: 'Asia/Kamchatka', offset: 'GMT+12' },
];

