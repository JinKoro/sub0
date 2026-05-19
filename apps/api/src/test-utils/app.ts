import { generateKeyPairSync } from 'node:crypto';

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { Transporter } from 'nodemailer';

import { TEST_DB_URL } from './db';

export interface SentMail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface TestApp {
  app: INestApplication;
  sent: SentMail[];
}

/** Boots the real AppModule against sub0_test with a fake SMTP transport. */
export async function createTestApp(): Promise<TestApp> {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DB_URL,
    JWT_PRIVATE_KEY: privateKey,
    JWT_PUBLIC_KEY: publicKey,
    JWT_ACCESS_TTL_SEC: '900',
    JWT_REFRESH_TTL_SEC: '7776000',
    COOKIE_SECURE: 'false',
    APP_BASE_URL: 'http://localhost:3000',
  });

  // Lazy import so env is set before ConfigModule validates it.
  const { AppModule } = await import('../app.module');
  const { MAIL_TRANSPORT } = await import('../mail/mail.service');
  const { MailScheduler } = await import('../mail/mail.scheduler');

  const sent: SentMail[] = [];
  const fakeTransport = {
    sendMail: (m: SentMail) => {
      sent.push(m);
      return Promise.resolve();
    },
  } as unknown as Transporter;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MAIL_TRANSPORT)
    .useValue(fakeTransport)
    // Disable the @Interval/@Cron scheduler — tests drive the worker manually.
    .overrideProvider(MailScheduler)
    .useValue({ tick: () => Promise.resolve(), retention: () => Promise.resolve() })
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return { app, sent };
}
