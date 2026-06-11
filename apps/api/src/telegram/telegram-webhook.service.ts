import { connectedMessage, expiredMessage } from './telegram-messages';
import type { TelegramSender } from './telegram.client';
import type { TelegramRepository } from './telegram.repository';

/** Минимальная форма Telegram Update, которую разбираем. Остальные типы
 *  апдейтов игнорируем. */
export interface TelegramUpdate {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
}

/** `/start <nonce>` — deep-link из connect-flow (#45). */
const START_RE = /^\/start\s+(\S+)$/;

export class TelegramWebhookService {
  constructor(
    private readonly repo: TelegramRepository,
    private readonly sender: TelegramSender,
  ) {}

  /** Обрабатывает один Update. Никогда не бросает на бизнес-ветках
   *  (неизвестный апдейт / истёкший nonce) — Telegram должен получить 200,
   *  иначе будет ретраить. Ошибки инфраструктуры (БД) пробрасываем —
   *  пусть Telegram ретраит, verify идемпотентен. */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const chatId = update.message?.chat?.id;
    const text = update.message?.text;
    if (chatId === undefined || !text) return;

    const match = START_RE.exec(text.trim());
    if (!match) return; // не deep-link — игнорируем

    const nonce = match[1];
    const result = await this.repo.verifyByNonce(nonce, String(chatId));

    const message = result
      ? connectedMessage(result.localeId)
      : expiredMessage();
    await this.sender.sendMessage(String(chatId), message);
  }
}
