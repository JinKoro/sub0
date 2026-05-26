import type { INestApplication } from '@nestjs/common';
import { BillingPeriod, Currency } from '@subzero/shared';
import request from 'supertest';

import { BillingNotificationService } from './billing-notification.service';
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

describe('Billing notifications e2e', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let svc: BillingNotificationService;

  beforeAll(async () => {
    await createTestDb();
    const t = await createTestApp();
    app = t.app;
    http = request(app.getHttpServer());
    svc = app.get(BillingNotificationService);
  });

  afterAll(async () => {
    await app.close();
    await closeTestPool();
    await dropTestDb();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  async function createSubInDays({
    email,
    daysAhead,
    leadDays,
    enabled = true,
  }: {
    email: string;
    daysAhead: number;
    leadDays?: number[];
    enabled?: boolean;
  }): Promise<{ cookies: string; subSku: string }> {
    await seedCustomer({ email, password: 'Passw0rd1' });
    await testPool().query(
      `UPDATE customer SET notifications_enabled = $2, notification_lead_days = $3 WHERE email = $1`,
      [email, enabled, leadDays ?? [3]],
    );
    const cookies = await login(http, email, 'Passw0rd1');
    await http.post(`${PFX}/projects`).set('Cookie', cookies).send({ name: 'Personal' });
    const projects = await http.get(`${PFX}/projects`).set('Cookie', cookies);
    const projectSku = projects.body[0].sku as string;
    const cats = await http.get(`${PFX}/categories`).set('Cookie', cookies);
    const categorySku = cats.body[0].sku as string;

    const next = new Date();
    next.setUTCHours(0, 0, 0, 0);
    next.setUTCDate(next.getUTCDate() + daysAhead);

    const r = await http
      .post(`${PFX}/subscriptions`)
      .set('Cookie', cookies)
      .send({
        projectSku,
        categorySku,
        nameCustom: `Sub ${email}`,
        amount: '500.00',
        currencyId: Currency.RUB,
        billingPeriodId: BillingPeriod.MONTH,
        firstBillingDate: next.toISOString(),
        nextBillingDate: next.toISOString(),
        isTrial: false,
      });
    expect(r.status).toBe(201);
    return { cookies, subSku: r.body.sku as string };
  }

  async function outboxCountFor(email: string): Promise<number> {
    const { rows } = await testPool().query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM mail_outbox
       WHERE to_email = $1 AND template = 'upcoming-charge'`,
      [email],
    );
    return rows[0].n;
  }

  it('cron создаёт письмо за 3 дня до списания и не дублирует при повторе', async () => {
    await createSubInDays({ email: 'a@e.com', daysAhead: 3, leadDays: [3] });

    const res1 = await svc.runDailyTick();
    expect(res1.candidates).toBe(1);
    expect(await outboxCountFor('a@e.com')).toBe(1);

    // Идемпотентность: повторный запуск тот же ключ → ON CONFLICT DO NOTHING.
    await svc.runDailyTick();
    expect(await outboxCountFor('a@e.com')).toBe(1);
  });

  it('подписка не попадает если daysUntil ∉ lead_days', async () => {
    await createSubInDays({ email: 'b@e.com', daysAhead: 5, leadDays: [3] });
    await svc.runDailyTick();
    expect(await outboxCountFor('b@e.com')).toBe(0);
  });

  it('notifications_enabled=false → ничего не отправляется', async () => {
    await createSubInDays({ email: 'c@e.com', daysAhead: 3, leadDays: [3], enabled: false });
    await svc.runDailyTick();
    expect(await outboxCountFor('c@e.com')).toBe(0);
  });

  it('подписка PAUSED не триггерит', async () => {
    const { cookies, subSku } = await createSubInDays({
      email: 'd@e.com',
      daysAhead: 3,
      leadDays: [3],
    });
    // Кладём подписку на паузу
    const sub = await http.get(`${PFX}/subscriptions/${subSku}`).set('Cookie', cookies);
    await http
      .post(`${PFX}/subscriptions/${subSku}`)
      .set('Cookie', cookies)
      .send({ stateId: 2, version: sub.body.version }); // SubscriptionState.PAUSED

    await svc.runDailyTick();
    expect(await outboxCountFor('d@e.com')).toBe(0);
  });

  it('endpoint POST /customers/me/notifications сохраняет настройки', async () => {
    await seedCustomer({ email: 'e@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'e@e.com', 'Passw0rd1');
    const me0 = await http.get(`${PFX}/customers/me`).set('Cookie', cookies);
    expect(me0.body.notificationsEnabled).toBe(true);
    expect(me0.body.notificationLeadDays).toEqual([3]);

    const r = await http
      .post(`${PFX}/customers/me/notifications`)
      .set('Cookie', cookies)
      .send({ enabled: false, leadDays: [1, 0], version: me0.body.version });
    expect(r.status).toBe(200);
    expect(r.body.notificationsEnabled).toBe(false);
    expect(new Set(r.body.notificationLeadDays)).toEqual(new Set([1, 0]));

    // Stale version → 409
    const stale = await http
      .post(`${PFX}/customers/me/notifications`)
      .set('Cookie', cookies)
      .send({ enabled: true, leadDays: [3], version: me0.body.version });
    expect(stale.status).toBe(409);
  });

  it('endpoint валидирует lead_days: только {0, 1, 3}', async () => {
    await seedCustomer({ email: 'f@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'f@e.com', 'Passw0rd1');
    const me = await http.get(`${PFX}/customers/me`).set('Cookie', cookies);

    const bad = await http
      .post(`${PFX}/customers/me/notifications`)
      .set('Cookie', cookies)
      .send({ enabled: true, leadDays: [7], version: me.body.version });
    expect(bad.status).toBe(400);
  });
});
