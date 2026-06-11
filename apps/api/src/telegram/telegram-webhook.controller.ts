import { timingSafeEqual } from 'node:crypto';

import { Body, Controller, ForbiddenException, Headers, HttpCode, Inject, Post } from '@nestjs/common';

import { TELEGRAM_WEBHOOK_SECRET } from './telegram.tokens';
import { TelegramWebhookService, type TelegramUpdate } from './telegram-webhook.service';

/** Публичный (без JwtAuthGuard) webhook Telegram-бота. Гейтится секретом
 *  `X-Telegram-Bot-Api-Secret-Token` (ctx-security §7). Всегда отдаёт 200,
 *  чтобы Telegram не ретраил бизнес-ветки. */
@Controller('integrations/telegram')
export class TelegramWebhookController {
  constructor(
    private readonly service: TelegramWebhookService,
    @Inject(TELEGRAM_WEBHOOK_SECRET) private readonly secret: string | undefined,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Headers('x-telegram-bot-api-secret-token') token: string | undefined,
    @Body() update: TelegramUpdate,
  ): Promise<{ ok: true }> {
    this.assertSecret(token);
    await this.service.handleUpdate(update);
    return { ok: true };
  }

  /** Fail-closed: без сконфигуренного секрета webhook отвергает всё. */
  private assertSecret(token: string | undefined): void {
    if (!this.secret || !token) throw new ForbiddenException();
    const expected = Buffer.from(this.secret);
    const got = Buffer.from(token);
    if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
      throw new ForbiddenException();
    }
  }
}
