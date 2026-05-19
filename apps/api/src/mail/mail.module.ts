import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

import { DrizzleMailOutboxRepository } from './mail-outbox.repository';
import { MailOutboxWorker } from './mail-outbox.worker';
import { MailScheduler } from './mail.scheduler';
import { MAIL_FROM, MAIL_TRANSPORT, MailService } from './mail.service';

@Module({
  providers: [
    DrizzleMailOutboxRepository,
    MailService,
    MailScheduler,
    {
      provide: MAIL_TRANSPORT,
      useFactory: (c: ConfigService) => {
        const user = c.get<string>('SMTP_USER');
        const pass = c.get<string>('SMTP_PASS');
        return createTransport({
          host: c.getOrThrow<string>('SMTP_HOST'),
          port: c.getOrThrow<number>('SMTP_PORT'),
          secure: false,
          auth: user ? { user, pass } : undefined,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: MAIL_FROM,
      useFactory: (c: ConfigService) => c.getOrThrow<string>('EMAIL_FROM'),
      inject: [ConfigService],
    },
    {
      provide: MailOutboxWorker,
      useFactory: (repo: DrizzleMailOutboxRepository, mail: MailService, c: ConfigService) =>
        new MailOutboxWorker(repo, mail, {
          baseUrl: c.getOrThrow<string>('APP_BASE_URL'),
          batchSize: 20,
          retentionDays: c.getOrThrow<number>('MAIL_RETENTION_DAYS'),
        }),
      inject: [DrizzleMailOutboxRepository, MailService, ConfigService],
    },
  ],
})
export class MailModule {}
