import { Logger } from '@nestjs/common';

/** Минимальный клиент Telegram Bot API — только то, что нужно сейчас:
 *  отправка текстового сообщения. Доставку нотификаций (#111) расширит
 *  этот же клиент, новых абстракций не заводим заранее.
 *
 *  Без `TELEGRAM_BOT_TOKEN` (dev/test) клиент — no-op: логируем warn и
 *  выходим, чтобы verify-flow не падал из-за отсутствия бота. */
export interface TelegramSender {
  sendMessage(chatId: string, text: string): Promise<void>;
}

const API_BASE = 'https://api.telegram.org';

export class TelegramClient implements TelegramSender {
  private readonly logger = new Logger(TelegramClient.name);

  constructor(private readonly botToken: string | undefined) {}

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — skipping sendMessage');
      return;
    }
    const res = await fetch(`${API_BASE}/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      // Best-effort: подтверждающее сообщение не критично для verify.
      // Доставка нотификаций (#111) добавит retry/outbox.
      this.logger.error(`sendMessage failed: ${res.status} ${await res.text()}`);
    }
  }
}
