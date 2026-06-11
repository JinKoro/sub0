import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TelegramClient } from './telegram.client';
import { DrizzleTelegramRepository } from './telegram.repository';
import { TELEGRAM_SENDER, TELEGRAM_WEBHOOK_SECRET } from './telegram.tokens';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramWebhookService } from './telegram-webhook.service';

@Module({
  controllers: [TelegramWebhookController],
  providers: [
    DrizzleTelegramRepository,
    {
      provide: TELEGRAM_SENDER,
      useFactory: (c: ConfigService) =>
        new TelegramClient(c.get<string>('TELEGRAM_BOT_TOKEN')),
      inject: [ConfigService],
    },
    {
      provide: TELEGRAM_WEBHOOK_SECRET,
      useFactory: (c: ConfigService) => c.get<string>('TELEGRAM_WEBHOOK_SECRET'),
      inject: [ConfigService],
    },
    {
      provide: TelegramWebhookService,
      useFactory: (repo: DrizzleTelegramRepository, sender: TelegramClient) =>
        new TelegramWebhookService(repo, sender),
      inject: [DrizzleTelegramRepository, TELEGRAM_SENDER],
    },
  ],
})
export class TelegramModule {}
