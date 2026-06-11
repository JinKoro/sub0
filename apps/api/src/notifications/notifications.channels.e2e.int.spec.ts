import type { INestApplication } from '@nestjs/common';
import { NotificationChannelType } from '@subzero/shared';
import request from 'supertest';

import { closeTestPool, createTestDb, dropTestDb, testPool, truncateAll } from '../test-utils/db';
import { createTestApp } from '../test-utils/app';
import { seedCustomer } from '../test-utils/seed';

const PFX = '/api/v1';

async function login(http: ReturnType<typeof request>, email: string, password: string) {
  const res = await http.post(`${PFX}/auth/login`).send({ email, password });
  expect(res.status).toBe(200);
  const cookies = res.headers['set-cookie'] as unknown as string[];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

describe('Notification channels e2e', () => {
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

  async function auth(email: string): Promise<string> {
    await seedCustomer({ email, password: 'Passw0rd1' });
    return login(http, email, 'Passw0rd1');
  }

  it('GET отдаёт seeded verified EMAIL-канал', async () => {
    const cookies = await auth('e1@e.com');
    const res = await http.get(`${PFX}/customers/me/notifications`).set('Cookie', cookies);
    expect(res.status).toBe(200);
    const emailCh = res.body.channels.find(
      (c: { typeId: number }) => c.typeId === NotificationChannelType.EMAIL,
    );
    expect(emailCh).toEqual({
      typeId: NotificationChannelType.EMAIL,
      address: 'e1@e.com',
      enabled: true,
      verified: true,
    });
  });

  it('connect TELEGRAM → deep-link + nonce, канал НЕ verified, виден в GET', async () => {
    const cookies = await auth('e2@e.com');
    const res = await http
      .post(`${PFX}/customers/me/notifications/channels/${NotificationChannelType.TELEGRAM}/connect`)
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.deepLink).toContain('https://t.me/sub0_bot?start=');
    expect(res.body.channel.verified).toBe(false);
    expect(res.body.expiresAt).toEqual(expect.any(String));

    const get = await http.get(`${PFX}/customers/me/notifications`).set('Cookie', cookies);
    const tg = get.body.channels.find(
      (c: { typeId: number }) => c.typeId === NotificationChannelType.TELEGRAM,
    );
    expect(tg).toMatchObject({ enabled: true, verified: false, address: null });
  });

  it('disconnect TELEGRAM → 204, канал исчезает', async () => {
    const cookies = await auth('e3@e.com');
    await http
      .post(`${PFX}/customers/me/notifications/channels/${NotificationChannelType.TELEGRAM}/connect`)
      .set('Cookie', cookies);
    const del = await http
      .post(
        `${PFX}/customers/me/notifications/channels/${NotificationChannelType.TELEGRAM}/disconnect`,
      )
      .set('Cookie', cookies);
    expect(del.status).toBe(204);

    const get = await http.get(`${PFX}/customers/me/notifications`).set('Cookie', cookies);
    const tg = get.body.channels.find(
      (c: { typeId: number }) => c.typeId === NotificationChannelType.TELEGRAM,
    );
    expect(tg).toBeUndefined();
  });

  it('connect EMAIL идемпотентен (verified, без deep-link)', async () => {
    const cookies = await auth('e4@e.com');
    const res = await http
      .post(`${PFX}/customers/me/notifications/channels/${NotificationChannelType.EMAIL}/connect`)
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.channel.verified).toBe(true);
    expect(res.body.deepLink).toBeUndefined();
  });

  it('disconnect EMAIL → 400 (базовый канал нельзя отключить)', async () => {
    const cookies = await auth('e5@e.com');
    const res = await http
      .post(`${PFX}/customers/me/notifications/channels/${NotificationChannelType.EMAIL}/disconnect`)
      .set('Cookie', cookies);
    expect(res.status).toBe(400);
  });

  it('hard-delete customer каскадно удаляет каналы', async () => {
    const id = await seedCustomer({ email: 'e6@e.com', password: 'Passw0rd1' });
    const before = await testPool().query(
      'SELECT count(*)::int AS n FROM notification_channel WHERE customer_id = $1',
      [id],
    );
    expect(before.rows[0].n).toBe(1);
    await testPool().query('DELETE FROM customer WHERE id = $1', [id]);
    const after = await testPool().query(
      'SELECT count(*)::int AS n FROM notification_channel WHERE customer_id = $1',
      [id],
    );
    expect(after.rows[0].n).toBe(0);
  });
});
