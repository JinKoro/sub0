import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TelegramClient } from './telegram.client';
import { DrizzleTelegramOutboxRepository } from './telegram-outbox.repository';
import { TelegramOutboxWorker } from './telegram-outbox.worker';
import { DrizzleTelegramRepository } from './telegram.repository';
import { TelegramScheduler } from './telegram.scheduler';
import { TELEGRAM_SENDER, TELEGRAM_WEBHOOK_SECRET } from './telegram.tokens';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramWebhookService } from './telegram-webhook.service';

@Module({
  controllers: [TelegramWebhookController],
  providers: [
    DrizzleTelegramRepository,
    DrizzleTelegramOutboxRepository,
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
    {
      provide: TelegramOutboxWorker,
      useFactory: (
        repo: DrizzleTelegramOutboxRepository,
        sender: TelegramClient,
        c: ConfigService,
      ) =>
        new TelegramOutboxWorker(repo, sender, {
          baseUrl: c.getOrThrow<string>('APP_BASE_URL'),
          batchSize: 20,
          retentionDays: c.get<number>('MAIL_RETENTION_DAYS') ?? 30,
        }),
      inject: [DrizzleTelegramOutboxRepository, TELEGRAM_SENDER, ConfigService],
    },
    TelegramScheduler,
  ],
})
export class TelegramModule {}
