import type { INestApplication } from '@nestjs/common';
import { BillingPeriod, Currency, SubscriptionState } from '@subzero/shared';
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

describe('Subscriptions e2e', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let cookies = '';
  let projectSku = '';
  let categorySku = '';

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
    await seedCustomer({ email: 'sub@e.com', password: 'Passw0rd1' });
    cookies = await login(http, 'sub@e.com', 'Passw0rd1');

    // seedCustomer не создаёт дефолтный проект (это делает register flow),
    // поэтому создаём его явно через API.
    await http.post(`${PFX}/projects`).set('Cookie', cookies).send({ name: 'Personal' });

    const projects = await http.get(`${PFX}/projects`).set('Cookie', cookies);
    projectSku = projects.body[0].sku;
    const cats = await http.get(`${PFX}/categories`).set('Cookie', cookies);
    categorySku = cats.body[0].sku;
  });

  it('create → list → get → update → delete → archived list', async () => {
    const created = await http
      .post(`${PFX}/subscriptions`)
      .set('Cookie', cookies)
      .send({
        projectSku,
        categorySku,
        nameCustom: 'Test Sub',
        amount: '500.00',
        currencyId: Currency.RUB,
        billingPeriodId: BillingPeriod.MONTH,
        firstBillingDate: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
        isTrial: false,
      });
    expect(created.status).toBe(201);
    const sku = created.body.sku as string;
    expect(sku).toMatch(/^sub-/);

    // Backfill — ровно 1 запись (35 дней назад → 1 цикл).
    const history = await testPool().query(
      'SELECT COUNT(*)::int AS n FROM billing_history WHERE subscription_id = (SELECT id FROM subscription WHERE sku=$1)',
      [sku],
    );
    expect(history.rows[0].n).toBe(1);

    const list = await http.get(`${PFX}/subscriptions`).set('Cookie', cookies);
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.total).toBe(1);

    const filtered = await http.get(`${PFX}/subscriptions?q=Test`).set('Cookie', cookies);
    expect(filtered.body.items[0].sku).toBe(sku);

    const got = await http.get(`${PFX}/subscriptions/${sku}`).set('Cookie', cookies);
    expect(got.status).toBe(200);
    expect(got.body.name).toBe('Test Sub');

    const updated = await http
      .post(`${PFX}/subscriptions/${sku}`)
      .set('Cookie', cookies)
      .send({ version: got.body.version, comment: 'note' });
    expect(updated.status).toBe(200);
    expect(updated.body.comment).toBe('note');

    const stale = await http
      .post(`${PFX}/subscriptions/${sku}`)
      .set('Cookie', cookies)
      .send({ version: got.body.version, comment: 'stale' });
    expect(stale.status).toBe(409);

    const removed = await http.delete(`${PFX}/subscriptions/${sku}`).set('Cookie', cookies);
    expect(removed.status).toBe(204);

    const afterDelete = await http.get(`${PFX}/subscriptions`).set('Cookie', cookies);
    expect(afterDelete.body.items).toHaveLength(0);

    const archived = await http
      .get(`${PFX}/subscriptions?status=archived`)
      .set('Cookie', cookies);
    expect(archived.body.items).toHaveLength(1);
    expect(archived.body.items[0].stateId).toBe(SubscriptionState.ARCHIVED);
  });

  it('hard-deletes subscriptions when project is deleted', async () => {
    await http
      .post(`${PFX}/subscriptions`)
      .set('Cookie', cookies)
      .send({
        projectSku,
        categorySku,
        nameCustom: 'Will Die',
        amount: '100.00',
        currencyId: Currency.RUB,
        billingPeriodId: BillingPeriod.MONTH,
        firstBillingDate: new Date().toISOString(),
        isTrial: false,
      });

    // Создаём второй проект, чтобы delete первого был разрешён
    // (нельзя удалить последний активный проект).
    await http.post(`${PFX}/projects`).set('Cookie', cookies).send({ name: 'Second' });

    const del = await http.delete(`${PFX}/projects/${projectSku}`).set('Cookie', cookies);
    expect(del.status).toBe(204);

    const left = await testPool().query(
      'SELECT COUNT(*)::int AS n FROM subscription WHERE project_id IN (SELECT id FROM project WHERE sku=$1)',
      [projectSku],
    );
    expect(left.rows[0].n).toBe(0);
  });
});

describe('Bulk red-zone DELETE /customers/me/subscriptions', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let cookies = '';
  let projectSku = '';
  let categorySku = '';

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
    await seedCustomer({ email: 'purge@e.com', password: 'Passw0rd1' });
    cookies = await login(http, 'purge@e.com', 'Passw0rd1');

    await http.post(`${PFX}/projects`).set('Cookie', cookies).send({ name: 'Personal' });

    const projects = await http.get(`${PFX}/projects`).set('Cookie', cookies);
    projectSku = projects.body[0].sku;
    const cats = await http.get(`${PFX}/categories`).set('Cookie', cookies);
    categorySku = cats.body[0].sku;
  });

  it('purges subscription + billing_history for 2 subs (204)', async () => {
    for (const name of ['Sub A', 'Sub B']) {
      const res = await http
        .post(`${PFX}/subscriptions`)
        .set('Cookie', cookies)
        .send({
          projectSku,
          categorySku,
          nameCustom: name,
          amount: '100.00',
          currencyId: Currency.RUB,
          billingPeriodId: BillingPeriod.MONTH,
          firstBillingDate: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
          isTrial: false,
        });
      expect(res.status).toBe(201);
    }

    const before = await testPool().query<{ subs: number; bh: number }>(
      `SELECT (SELECT COUNT(*)::int FROM subscription
              WHERE customer_id = (SELECT id FROM customer WHERE email='purge@e.com')) AS subs,
             (SELECT COUNT(*)::int FROM billing_history
              WHERE customer_id = (SELECT id FROM customer WHERE email='purge@e.com')) AS bh`,
    );
    expect(before.rows[0].subs).toBe(2);
    expect(before.rows[0].bh).toBeGreaterThan(0);

    const purge = await http.delete(`${PFX}/customers/me/subscriptions`).set('Cookie', cookies);
    expect(purge.status).toBe(204);

    const after = await testPool().query<{ subs: number; bh: number }>(
      `SELECT (SELECT COUNT(*)::int FROM subscription
              WHERE customer_id = (SELECT id FROM customer WHERE email='purge@e.com')) AS subs,
             (SELECT COUNT(*)::int FROM billing_history
              WHERE customer_id = (SELECT id FROM customer WHERE email='purge@e.com')) AS bh`,
    );
    expect(after.rows[0].subs).toBe(0);
    expect(after.rows[0].bh).toBe(0);
  });

  it('returns 204 on second call (idempotent on empty)', async () => {
    const first = await http.delete(`${PFX}/customers/me/subscriptions`).set('Cookie', cookies);
    expect(first.status).toBe(204);

    const second = await http.delete(`${PFX}/customers/me/subscriptions`).set('Cookie', cookies);
    expect(second.status).toBe(204);
  });
});
