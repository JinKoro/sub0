import { Locale } from '@subzero/shared';

/** Тексты бота при verify connect-flow. Без user-input → plain text,
 *  MarkdownV2-escape не нужен (ctx-security §10). Язык — `customer.localeId`,
 *  fallback RU (для неизвестного nonce customer'а ещё не знаем). */
const MESSAGES = {
  connected: {
    [Locale.RU]: 'Готово! Telegram подключён — сюда будут приходить напоминания о списаниях.',
    [Locale.EN]: 'Done! Telegram is connected — billing reminders will arrive here.',
  },
  expired: {
    [Locale.RU]: 'Ссылка устарела или уже использована. Переподключите Telegram в настройках Sub0.',
    [Locale.EN]: 'This link has expired or was already used. Reconnect Telegram in Sub0 settings.',
  },
} as const;

function pick(map: Record<number, string>, localeId: number): string {
  return map[localeId] ?? map[Locale.RU];
}

export function connectedMessage(localeId: number): string {
  return pick(MESSAGES.connected, localeId);
}

export function expiredMessage(localeId: number = Locale.RU): string {
  return pick(MESSAGES.expired, localeId);
}
