import { Locale } from '@subzero/shared';

export interface MailContext {
  verifyPath: string;
  name?: string;
}

export interface RenderedMail {
  subject: string;
  html: string;
  text: string;
}

type Lang = 'ru' | 'en';

interface Copy {
  subject: string;
  heading: string;
  lead: string;
  cta: string;
  fallback: string;
}

const COPY: Record<string, Record<Lang, Copy>> = {
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
  return localeId === Locale.EN ? 'en' : 'ru'; // unknown → ru
}

export function renderMail(
  template: string,
  localeId: number,
  ctx: MailContext,
  baseUrl: string,
): RenderedMail {
  const byLang = COPY[template];
  if (!byLang) {
    throw new Error(`unknown mail template: ${template}`);
  }
  const c = byLang[langOf(localeId)];
  const link = `${baseUrl.replace(/\/+$/, '')}${ctx.verifyPath}`;
  const hi = ctx.name ? `${ctx.name}, ` : '';

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
