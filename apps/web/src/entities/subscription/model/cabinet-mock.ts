import type { CabinetSubscription, SubCategory } from './cabinet-types';
import { serviceIcon } from '@/entities/service-catalog/lib/icon-map';

export interface PresetService {
  name: string;
  char: string;
  color: string;
  cat: string;
  icon?: string | null;
}

const PRESET_RAW: PresetService[] = [
  { name: 'Netflix', char: 'N', color: '#c94a1c', cat: 'video' },
  { name: 'Spotify', char: 'S', color: '#0a7a3f', cat: 'music' },
  { name: 'Apple Music', char: 'A', color: '#0a0a0a', cat: 'music' },
  { name: 'YouTube Premium', char: 'Y', color: '#c94a1c', cat: 'video' },
  { name: 'Notion', char: 'N', color: '#0a0a0a', cat: 'productivity' },
  { name: 'Figma', char: 'F', color: '#c94a1c', cat: 'productivity' },
  { name: 'GitHub', char: 'G', color: '#0a0a0a', cat: 'productivity' },
  { name: 'iCloud+', char: 'i', color: '#6b6b66', cat: 'storage' },
  { name: 'Dropbox', char: 'D', color: '#1347ff', cat: 'storage' },
  { name: 'ChatGPT Plus', char: 'G', color: '#0a7a3f', cat: 'productivity' },
  { name: 'Linear', char: 'L', color: '#5e6ad2', cat: 'productivity' },
  { name: '1Password', char: '1', color: '#1347ff', cat: 'productivity' },
];

export const PRESET_SERVICES: PresetService[] = PRESET_RAW.map((s) => ({
  ...s,
  icon: serviceIcon(s.name),
}));

export const CATEGORIES: SubCategory[] = [
  { id: 'video', name: 'Видео', nameEn: 'Video', color: '#1347ff' },
  { id: 'music', name: 'Музыка', nameEn: 'Music', color: '#0a7a3f' },
  { id: 'productivity', name: 'Продуктивность', nameEn: 'Productivity', color: '#0a0a0a' },
  { id: 'storage', name: 'Хранилище', nameEn: 'Storage', color: '#b0851a' },
  { id: 'fitness', name: 'Спорт', nameEn: 'Fitness', color: '#c94a1c' },
  { id: 'education', name: 'Образование', nameEn: 'Education', color: '#6b21d9' },
  { id: 'hosting', name: 'Хостинг', nameEn: 'Hosting', color: '#c94a1c' },
  { id: 'banking', name: 'Банк', nameEn: 'Banking', color: '#b0851a' },
  { id: 'messaging', name: 'Связь', nameEn: 'Messaging', color: '#1347ff' },
  { id: 'other', name: 'Другое', nameEn: 'Other', color: '#6b6b66' },
];

const CAB_SUBS_RAW: CabinetSubscription[] = [
  { id: 1, name: 'Яндекс Плюс', char: 'Я', project: 'personal', cat: 'video', cycle: 'monthly', trial: false, nextDay: 2, nextMonth: 4, price: 399, cur: 'RUB', status: 'active', color: '#ffcc00', note: 'Семейная подписка' },
  { id: 2, name: 'Netflix', char: 'N', project: 'family', cat: 'video', cycle: 'monthly', trial: false, promo: true, promoEndsDay: 5, promoEndsMonth: 5, nextDay: 5, nextMonth: 5, price: 799, cur: 'RUB', status: 'active', color: '#c94a1c', note: '' },
  { id: 3, name: 'Spotify', char: 'S', project: 'personal', cat: 'music', cycle: 'monthly', trial: false, promo: true, promoEndsDay: 11, promoEndsMonth: 4, nextDay: 11, nextMonth: 5, price: 299, cur: 'RUB', status: 'active', color: '#0a7a3f', note: '' },
  { id: 4, name: 'VK Музыка', char: 'V', project: 'personal', cat: 'music', cycle: 'monthly', trial: false, nextDay: 14, nextMonth: 5, price: 199, cur: 'RUB', status: 'active', color: '#1347ff', note: '' },
  { id: 5, name: 'СберПрайм', char: 'С', project: 'family', cat: 'other', cycle: 'monthly', trial: true, nextDay: 9, nextMonth: 5, price: 299, cur: 'RUB', status: 'active', color: '#0a7a3f', note: 'Триал заканчивается через 5 дней' },
  { id: 6, name: 'Okko', char: 'O', project: 'family', cat: 'video', cycle: 'yearly', trial: false, nextDay: 12, nextMonth: 10, price: 4990, cur: 'RUB', status: 'active', color: '#6b21d9', note: '' },
  { id: 7, name: 'Telegram Premium', char: 'T', project: 'personal', cat: 'messaging', cycle: 'monthly', trial: false, nextDay: 3, nextMonth: 4, price: 349, cur: 'RUB', status: 'active', color: '#1347ff', note: '' },
  { id: 8, name: 'Selectel', char: 'S', project: 'work', cat: 'hosting', cycle: 'monthly', trial: false, nextDay: 7, nextMonth: 4, price: 1290, cur: 'RUB', status: 'paused', color: '#c94a1c', note: 'Поставлено на паузу' },
  { id: 9, name: 'Т‑Банк Pro', char: 'Т', project: 'personal', cat: 'banking', cycle: 'monthly', trial: false, nextDay: 19, nextMonth: 5, price: 299, cur: 'RUB', status: 'active', color: '#b0851a', note: '' },
  { id: 10, name: 'Notion', char: 'N', project: 'work', cat: 'productivity', cycle: 'monthly', trial: false, nextDay: 5, nextMonth: 4, price: 10, cur: 'USD', status: 'active', color: '#0a0a0a', note: '' },
  { id: 11, name: 'Figma Pro', char: 'F', project: 'work', cat: 'productivity', cycle: 'monthly', trial: false, nextDay: 22, nextMonth: 5, price: 15, cur: 'USD', status: 'active', color: '#c94a1c', note: '' },
  { id: 12, name: 'GitHub Copilot', char: 'G', project: 'work', cat: 'productivity', cycle: 'monthly', trial: true, nextDay: 9, nextMonth: 4, price: 10, cur: 'USD', status: 'active', color: '#0a0a0a', note: 'Триал' },
  { id: 13, name: 'iCloud+', char: 'i', project: 'personal', cat: 'storage', cycle: 'monthly', trial: false, nextDay: 9, nextMonth: 5, price: 149, cur: 'RUB', status: 'active', color: '#6b6b66', note: '' },
  { id: 14, name: 'FitnessPro', char: 'F', project: 'personal', cat: 'fitness', cycle: 'monthly', trial: false, nextDay: 25, nextMonth: 4, price: 2900, cur: 'RUB', status: 'cancel', color: '#c94a1c', note: 'Отменена, работает до 25 мая' },
  { id: 15, name: 'Kinopoisk HD', char: 'К', project: 'family', cat: 'video', cycle: 'yearly', trial: false, nextDay: 8, nextMonth: 8, price: 2999, cur: 'RUB', status: 'active', color: '#c94a1c', note: '' },
  { id: 16, name: 'Coursera Plus', char: 'C', project: 'personal', cat: 'education', cycle: 'yearly', trial: false, nextDay: 14, nextMonth: 6, price: 399, cur: 'USD', status: 'active', color: '#1347ff', note: '' },
  { id: 17, name: 'Zoom Pro', char: 'Z', project: 'work', cat: 'productivity', cycle: 'monthly', trial: false, nextDay: 16, nextMonth: 5, price: 14, cur: 'USD', status: 'active', color: '#1347ff', note: '' },
  { id: 18, name: 'Google One', char: 'G', project: 'family', cat: 'storage', cycle: 'monthly', trial: false, nextDay: 4, nextMonth: 4, price: 199, cur: 'RUB', status: 'active', color: '#0a7a3f', note: '' },
  { id: 19, name: 'World Class', char: 'W', project: 'personal', cat: 'fitness', cycle: 'yearly', trial: false, nextDay: 1, nextMonth: 9, price: 35000, cur: 'RUB', status: 'active', color: '#0a0a0a', note: 'Абонемент в зал' },
  { id: 20, name: '1Password', char: '1', project: 'work', cat: 'productivity', cycle: 'yearly', trial: false, nextDay: 4, nextMonth: 5, price: 60, cur: 'USD', status: 'active', color: '#1347ff', note: '' },
  { id: 21, name: 'ChatGPT Plus', char: 'C', project: 'personal', cat: 'productivity', cycle: 'monthly', trial: false, nextDay: 9, nextMonth: 5, price: 20, cur: 'USD', status: 'active', color: '#0a7a3f', note: '' },
  { id: 22, name: 'Claude Pro', char: 'C', project: 'work', cat: 'productivity', cycle: 'monthly', trial: false, nextDay: 9, nextMonth: 5, price: 20, cur: 'USD', status: 'active', color: '#c94a1c', note: '' },
  { id: 23, name: 'Linear', char: 'L', project: 'work', cat: 'productivity', cycle: 'monthly', trial: false, nextDay: 9, nextMonth: 5, price: 8, cur: 'USD', status: 'active', color: '#1347ff', note: '' },
  { id: 24, name: 'Vercel Pro', char: 'V', project: 'work', cat: 'hosting', cycle: 'monthly', trial: false, nextDay: 23, nextMonth: 5, price: 20, cur: 'USD', status: 'active', color: '#0a0a0a', note: '' },
  { id: 25, name: 'ИВИ', char: 'И', project: 'family', cat: 'video', cycle: 'monthly', trial: false, nextDay: 27, nextMonth: 5, price: 599, cur: 'RUB', status: 'active', color: null, note: '' },
  { id: 26, name: 'MyFitness', char: 'M', project: 'personal', cat: 'fitness', cycle: 'monthly', trial: false, nextDay: 28, nextMonth: 5, price: 1490, cur: 'RUB', status: 'active', color: null, note: '' },
];

export const CAB_SUBS: CabinetSubscription[] = CAB_SUBS_RAW.map((s) => ({
  ...s,
  icon: serviceIcon(s.name),
}));
