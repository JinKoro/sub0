import { Locale } from '@subzero/shared';

export type MailTemplate = 'verify-email' | 'reset-password' | 'upcoming-charge';

/** verify-email и reset-password сейчас идентичны по полям, но разделены семантически. */
export interface VerifyMailContext {
  verifyPath: string;
  name?: string;
}

export interface ResetMailContext {
  verifyPath: string;
  name?: string;
}

export interface UpcomingChargeMailContext {
  /** Относительный path до подписки в кабинете: /account/subscriptions/{sku}. */
  subscriptionPath: string;
  serviceName: string;
  /** Сумма в исходной валюте подписки, форматированная: "1500.00". */
  amount: string;
  /** ISO-код валюты или '₽'/'$'/'€'/'BYN'. */
  currency: string;
  /** Дата списания в формате YYYY-MM-DD. Отображается локализованно. */
  billingDate: string;
  /** За сколько дней — для темы письма ("через 3 дня" / "сегодня"). */
  daysBefore: number;
  projectName: string;
  name?: string;
}

export type MailContext = VerifyMailContext | ResetMailContext | UpcomingChargeMailContext;

export interface RenderedMail {
  subject: string;
  html: string;
  text: string;
}

type Lang = 'ru' | 'en';

interface SimpleCopy {
  subject: string;
  heading: string;
  lead: string;
  cta: string;
  fallback: string;
}

const SIMPLE_COPY: Record<'verify-email' | 'reset-password', Record<Lang, SimpleCopy>> = {
  'verify-email': {
    ru: {
      subject: 'Sub0 — подтвердите регистрацию',
      heading: 'Подтвердите регистрацию',
      lead: 'Чтобы завершить создание аккаунта в Sub0, задайте пароль по ссылке ниже.',
      cta: 'Завершить регистрацию',
      fallback: 'Если кнопка не работает, откройте ссылку:',
    },
    en: {
      subject: 'Sub0 — confirm your registration',
      heading: 'Confirm your registration',
      lead: 'To finish creating your Sub0 account, set a password via the link below.',
      cta: 'Finish signing up',
      fallback: 'If the button does not work, open this link:',
    },
  },
  'reset-password': {
    ru: {
      subject: 'Sub0 — сброс пароля',
      heading: 'Сброс пароля',
      lead: 'Вы запросили сброс пароля. Задайте новый по ссылке ниже. Если это были не вы — проигнорируйте письмо.',
      cta: 'Сбросить пароль',
      fallback: 'Если кнопка не работает, откройте ссылку:',
    },
    en: {
      subject: 'Sub0 — password reset',
      heading: 'Password reset',
      lead: 'You requested a password reset. Set a new one via the link below. If this was not you, ignore this email.',
      cta: 'Reset password',
      fallback: 'If the button does not work, open this link:',
    },
  },
};

function langOf(localeId: number): Lang {
  return localeId === Locale.EN ? 'en' : 'ru';
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderSimple(
  template: 'verify-email' | 'reset-password',
  lang: Lang,
  ctx: VerifyMailContext | ResetMailContext,
  baseUrl: string,
): RenderedMail {
  const c = SIMPLE_COPY[template][lang];
  const link = joinUrl(baseUrl, ctx.verifyPath);
  const hi = ctx.name ? `${escape(ctx.name)}, ` : '';

  const html = `<!doctype html><html><body style="font-family:system-ui,Arial,sans-serif;color:#1a1a1a">
<h1 style="font-size:20px">${c.heading}</h1>
<p>${hi}${c.lead}</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:8px">${c.cta}</a></p>
<p style="color:#888;font-size:13px">${c.fallback}<br><a href="${link}">${link}</a></p>
</body></html>`;

  const text = `${c.heading}

${hi}${c.lead}

${c.cta}: ${link}`;

  return { subject: c.subject, html, text };
}

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(dateIso: string, lang: Lang): string {
  // billingDate приходит как YYYY-MM-DD (UTC date)
  const parts = dateIso.slice(0, 10).split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return dateIso;
  const months = lang === 'en' ? MONTHS_EN : MONTHS_RU;
  return lang === 'en' ? `${months[m]} ${d}, ${y}` : `${d} ${months[m]} ${y}`;
}

function renderUpcomingCharge(
  lang: Lang,
  ctx: UpcomingChargeMailContext,
  baseUrl: string,
): RenderedMail {
  const link = joinUrl(baseUrl, ctx.subscriptionPath);
  const hi = ctx.name ? `${escape(ctx.name)}, ` : '';
  const date = formatDate(ctx.billingDate, lang);
  const amount = `${escape(ctx.amount)} ${escape(ctx.currency)}`;
  const service = escape(ctx.serviceName);
  const project = escape(ctx.projectName);

  const subject =
    lang === 'en'
      ? ctx.daysBefore === 0
        ? `Sub0 — ${service} charges today`
        : `Sub0 — ${service} charges in ${ctx.daysBefore} day${ctx.daysBefore === 1 ? '' : 's'}`
      : ctx.daysBefore === 0
        ? `Sub0 — сегодня списание за ${service}`
        : `Sub0 — через ${ctx.daysBefore} ${pluralRu(ctx.daysBefore, 'день', 'дня', 'дней')} спишется ${service}`;

  const heading =
    lang === 'en'
      ? ctx.daysBefore === 0
        ? `${service} charges today`
        : `${service} charges in ${ctx.daysBefore} day${ctx.daysBefore === 1 ? '' : 's'}`
      : ctx.daysBefore === 0
        ? `Сегодня списание за ${service}`
        : `Через ${ctx.daysBefore} ${pluralRu(ctx.daysBefore, 'день', 'дня', 'дней')} спишется ${service}`;

  const lead =
    lang === 'en'
      ? `${date} — <b>${amount}</b> from your ${project} project.`
      : `${date} — <b>${amount}</b> из проекта «${project}».`;

  const cta = lang === 'en' ? 'Open subscription' : 'Открыть подписку';
  const fallback =
    lang === 'en' ? 'If the button does not work, open this link:' : 'Если кнопка не работает, откройте ссылку:';

  const html = `<!doctype html><html><body style="font-family:system-ui,Arial,sans-serif;color:#1a1a1a">
<h1 style="font-size:20px">${heading}</h1>
<p>${hi}${lead}</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:8px">${cta}</a></p>
<p style="color:#888;font-size:13px">${fallback}<br><a href="${link}">${link}</a></p>
</body></html>`;

  const text = `${heading}

${hi}${date} — ${amount} (${project})

${cta}: ${link}`;

  return { subject, html, text };
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function renderMail(
  template: string,
  localeId: number,
  ctx: MailContext,
  baseUrl: string,
): RenderedMail {
  const lang = langOf(localeId);
  if (template === 'verify-email' || template === 'reset-password') {
    return renderSimple(template, lang, ctx as VerifyMailContext, baseUrl);
  }
  if (template === 'upcoming-charge') {
    return renderUpcomingCharge(lang, ctx as UpcomingChargeMailContext, baseUrl);
  }
  throw new Error(`unknown mail template: ${template}`);
}
