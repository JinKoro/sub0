import type { INestApplication } from '@nestjs/common';
import { NotificationChannelType } from '@subzero/shared';
import request from 'supertest';

import { closeTestPool, createTestDb, dropTestDb, testPool, truncateAll } from '../test-utils/db';
import { createTestApp } from '../test-utils/app';
import { seedCustomer } from '../test-utils/seed';

const PFX = '/api/v1';
const SECRET = 'test-webhook-secret';
const WEBHOOK = `${PFX}/integrations/telegram/webhook`;

async function login(http: ReturnType<typeof request>, email: string, password: string) {
  const res = await http.post(`${PFX}/auth/login`).send({ email, password });
  expect(res.status).toBe(200);
  const cookies = res.headers['set-cookie'] as unknown as string[];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

/** Подключает TG-канал через connect-flow и возвращает сгенерированный nonce. */
async function connectTelegram(
  http: ReturnType<typeof request>,
  cookies: string,
  customerId: string,
): Promise<string> {
  const res = await http
    .post(`${PFX}/customers/me/notifications/channels/${NotificationChannelType.TELEGRAM}/connect`)
    .set('Cookie', cookies);
  expect(res.status).toBe(200);
  const { rows } = await testPool().query(
    'SELECT connect_nonce FROM notification_channel WHERE customer_id = $1 AND type_id = $2',
    [customerId, NotificationChannelType.TELEGRAM],
  );
  return rows[0].connect_nonce as string;
}

describe('Telegram webhook e2e', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    await createTestDb();
    const t = await createTestApp();
    app = t.app;
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
    await closeTestPool();
    await dropTestDb();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  it('valid /start <nonce> + secret → канал verified с chat_id', async () => {
    const id = await seedCustomer({ email: 'w1@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'w1@e.com', 'Passw0rd1');
    const nonce = await connectTelegram(http, cookies, id);

    const res = await http
      .post(WEBHOOK)
      .set('X-Telegram-Bot-Api-Secret-Token', SECRET)
      .send({ message: { chat: { id: 999001 }, text: `/start ${nonce}` } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const { rows } = await testPool().query(
      'SELECT address, verified_at, connect_nonce FROM notification_channel WHERE customer_id = $1 AND type_id = $2',
      [id, NotificationChannelType.TELEGRAM],
    );
    expect(rows[0].address).toBe('999001');
    expect(rows[0].verified_at).not.toBeNull();
    expect(rows[0].connect_nonce).toBeNull();
  });

  it('повторный /start тем же nonce — без ошибки, канал остаётся verified (идемпотентно)', async () => {
    const id = await seedCustomer({ email: 'w2@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'w2@e.com', 'Passw0rd1');
    const nonce = await connectTelegram(http, cookies, id);

    const send = () =>
      http
        .post(WEBHOOK)
        .set('X-Telegram-Bot-Api-Secret-Token', SECRET)
        .send({ message: { chat: { id: 42 }, text: `/start ${nonce}` } });

    expect((await send()).status).toBe(200);
    // nonce уже погашен — второй заход не находит строку, отвечает нейтрально.
    expect((await send()).status).toBe(200);

    const { rows } = await testPool().query(
      'SELECT verified_at FROM notification_channel WHERE customer_id = $1 AND type_id = $2',
      [id, NotificationChannelType.TELEGRAM],
    );
    expect(rows[0].verified_at).not.toBeNull();
  });

  it('истёкший nonce → 200, но канал НЕ verified', async () => {
    const id = await seedCustomer({ email: 'w3@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'w3@e.com', 'Passw0rd1');
    const nonce = await connectTelegram(http, cookies, id);
    await testPool().query(
      `UPDATE notification_channel SET connect_nonce_expires_at = now() - interval '1 minute'
       WHERE customer_id = $1 AND type_id = $2`,
      [id, NotificationChannelType.TELEGRAM],
    );

    const res = await http
      .post(WEBHOOK)
      .set('X-Telegram-Bot-Api-Secret-Token', SECRET)
      .send({ message: { chat: { id: 1 }, text: `/start ${nonce}` } });
    expect(res.status).toBe(200);

    const { rows } = await testPool().query(
      'SELECT verified_at FROM notification_channel WHERE customer_id = $1 AND type_id = $2',
      [id, NotificationChannelType.TELEGRAM],
    );
    expect(rows[0].verified_at).toBeNull();
  });

  it('неверный secret → 403, канал не трогаем', async () => {
    const id = await seedCustomer({ email: 'w4@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'w4@e.com', 'Passw0rd1');
    const nonce = await connectTelegram(http, cookies, id);

    const res = await http
      .post(WEBHOOK)
      .set('X-Telegram-Bot-Api-Secret-Token', 'wrong')
      .send({ message: { chat: { id: 1 }, text: `/start ${nonce}` } });
    expect(res.status).toBe(403);

    const { rows } = await testPool().query(
      'SELECT verified_at FROM notification_channel WHERE customer_id = $1 AND type_id = $2',
      [id, NotificationChannelType.TELEGRAM],
    );
    expect(rows[0].verified_at).toBeNull();
  });

  it('без secret-заголовка → 403', async () => {
    const res = await http
      .post(WEBHOOK)
      .send({ message: { chat: { id: 1 }, text: '/start whatever' } });
    expect(res.status).toBe(403);
  });
});
