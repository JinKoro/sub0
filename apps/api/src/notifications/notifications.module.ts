import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationsController } from './notifications.controller';
import { DrizzleNotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    DrizzleNotificationsRepository,
    {
      provide: NotificationsService,
      useFactory: (repo: DrizzleNotificationsRepository, c: ConfigService) =>
        new NotificationsService(repo, {
          telegramBotUsername: c.get<string>('TELEGRAM_BOT_USERNAME') ?? 'sub0_bot',
          maxBotUrlBase: c.get<string>('MAX_BOT_URL_BASE') ?? null,
        }),
      inject: [DrizzleNotificationsRepository, ConfigService],
    },
  ],
})
export class NotificationsModule {}
