import { Locale } from '@subzero/shared';

/** Контекст upcoming-charge — совпадает с email-версией (один источник в
 *  billing-notification). */
export interface UpcomingChargeTelegramContext {
  subscriptionPath: string;
  serviceName: string;
  amount: string;
  currency: string;
  billingDate: string; // YYYY-MM-DD
  daysBefore: number;
  projectName: string;
  name?: string;
}

type Lang = 'ru' | 'en';

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function langOf(localeId: number): Lang {
  return localeId === Locale.EN ? 'en' : 'ru';
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

function formatDate(dateIso: string, lang: Lang): string {
  const [y, m, d] = dateIso.slice(0, 10).split('-').map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return dateIso;
  const months = lang === 'en' ? MONTHS_EN : MONTHS_RU;
  return lang === 'en' ? `${months[m - 1]} ${d}, ${y}` : `${d} ${months[m - 1]} ${y}`;
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** Текст напоминания о списании. Plain text (без parse_mode) — user-input
 *  (название подписки / проекта) не интерпретируется, escape не нужен
 *  (ctx-security §10). Сумму/валюту шлём, last4/payment-метаданные — нет. */
function renderUpcomingCharge(
  lang: Lang,
  ctx: UpcomingChargeTelegramContext,
  baseUrl: string,
): string {
  const link = joinUrl(baseUrl, ctx.subscriptionPath);
  const amount = `${ctx.amount} ${ctx.currency}`;
  const date = formatDate(ctx.billingDate, lang);

  if (lang === 'en') {
    const when =
      ctx.daysBefore === 0
        ? `${ctx.serviceName} charges today`
        : `${ctx.serviceName} charges in ${ctx.daysBefore} day${ctx.daysBefore === 1 ? '' : 's'} (${date})`;
    return `🔔 ${when}\n${amount} — project "${ctx.projectName}".\n${link}`;
  }

  const when =
    ctx.daysBefore === 0
      ? `Сегодня списание: ${ctx.serviceName}`
      : `Через ${ctx.daysBefore} ${pluralRu(ctx.daysBefore, 'день', 'дня', 'дней')} спишется ${ctx.serviceName} (${date})`;
  return `🔔 ${when}\n${amount} — проект «${ctx.projectName}».\n${link}`;
}

export function renderTelegram(
  template: string,
  localeId: number,
  ctx: UpcomingChargeTelegramContext,
  baseUrl: string,
): string {
  if (template === 'upcoming-charge') {
    return renderUpcomingCharge(langOf(localeId), ctx, baseUrl);
  }
  throw new Error(`unknown telegram template: ${template}`);
}
