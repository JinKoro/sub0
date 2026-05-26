import type { INestApplication } from '@nestjs/common';
import { BillingPeriod, Currency } from '@subzero/shared';
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

describe('Billing-history e2e', () => {
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

  async function prepareCustomerWithBackfilledSub(email: string, projectName = 'Personal') {
    await seedCustomer({ email, password: 'Passw0rd1' });
    const cookies = await login(http, email, 'Passw0rd1');
    await http.post(`${PFX}/projects`).set('Cookie', cookies).send({ name: projectName });
    const projects = await http.get(`${PFX}/projects`).set('Cookie', cookies);
    const projectSku = projects.body[0].sku as string;
    const cats = await http.get(`${PFX}/categories`).set('Cookie', cookies);
    const categorySku = cats.body[0].sku as string;

    // 35 дней назад → 1 запись в billing_history через backfill.
    const created = await http
      .post(`${PFX}/subscriptions`)
      .set('Cookie', cookies)
      .send({
        projectSku,
        categorySku,
        nameCustom: `Sub ${email}`,
        amount: '500.00',
        currencyId: Currency.RUB,
        billingPeriodId: BillingPeriod.MONTH,
        firstBillingDate: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
        isTrial: false,
      });
    expect(created.status).toBe(201);
    return { cookies, projectSku, subSku: created.body.sku as string };
  }

  it('возвращает свои записи в окне, ISO-форматированные', async () => {
    const { cookies, subSku, projectSku } = await prepareCustomerWithBackfilledSub('a@e.com');
    const from = new Date(Date.now() - 60 * 86400 * 1000).toISOString();
    const to = new Date().toISOString();
    const res = await http
      .get(`${PFX}/billing-history?from=${from}&to=${to}`)
      .set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    const entry = res.body.items[0];
    expect(entry.subscriptionSku).toBe(subSku);
    expect(entry.projectSku).toBe(projectSku);
    expect(entry.amount).toBe('500.00');
    expect(entry.currencyId).toBe(Currency.RUB);
    expect(typeof entry.billedAt).toBe('string');
    expect(entry.billedAt).toMatch(/T/);
  });

  it('не отдаёт чужие записи', async () => {
    const a = await prepareCustomerWithBackfilledSub('a2@e.com');
    await prepareCustomerWithBackfilledSub('b2@e.com');

    const from = new Date(Date.now() - 60 * 86400 * 1000).toISOString();
    const to = new Date().toISOString();
    const res = await http
      .get(`${PFX}/billing-history?from=${from}&to=${to}`)
      .set('Cookie', a.cookies);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].subscriptionSku).toBe(a.subSku);
  });

  it('фильтрует по projectSku', async () => {
    const a = await prepareCustomerWithBackfilledSub('a3@e.com');
    // Второй проект + ещё одна подписка
    await http.post(`${PFX}/projects`).set('Cookie', a.cookies).send({ name: 'Work' });
    const projects = await http.get(`${PFX}/projects`).set('Cookie', a.cookies);
    const workSku = projects.body.find((p: { name: string }) => p.name === 'Work').sku as string;
    const cats = await http.get(`${PFX}/categories`).set('Cookie', a.cookies);
    await http
      .post(`${PFX}/subscriptions`)
      .set('Cookie', a.cookies)
      .send({
        projectSku: workSku,
        categorySku: cats.body[0].sku,
        nameCustom: 'Work sub',
        amount: '900.00',
        currencyId: Currency.RUB,
        billingPeriodId: BillingPeriod.MONTH,
        firstBillingDate: new Date(Date.now() - 40 * 86400 * 1000).toISOString(),
        isTrial: false,
      });

    const from = new Date(Date.now() - 60 * 86400 * 1000).toISOString();
    const to = new Date().toISOString();
    const personalRes = await http
      .get(`${PFX}/billing-history?from=${from}&to=${to}&projectSku=${a.projectSku}`)
      .set('Cookie', a.cookies);
    expect(personalRes.body.items).toHaveLength(1);
    expect(personalRes.body.items[0].projectSku).toBe(a.projectSku);

    const workRes = await http
      .get(`${PFX}/billing-history?from=${from}&to=${to}&projectSku=${workSku}`)
      .set('Cookie', a.cookies);
    expect(workRes.body.items).toHaveLength(1);
    expect(workRes.body.items[0].projectSku).toBe(workSku);

    const all = await http
      .get(`${PFX}/billing-history?from=${from}&to=${to}`)
      .set('Cookie', a.cookies);
    expect(all.body.items).toHaveLength(2);
  });

  it('soft-deleted записи скрыты', async () => {
    const a = await prepareCustomerWithBackfilledSub('a4@e.com');
    await testPool().query(
      'UPDATE billing_history SET deleted_at = now() WHERE customer_id = (SELECT id FROM customer WHERE email=$1)',
      ['a4@e.com'],
    );
    const from = new Date(Date.now() - 60 * 86400 * 1000).toISOString();
    const to = new Date().toISOString();
    const res = await http
      .get(`${PFX}/billing-history?from=${from}&to=${to}`)
      .set('Cookie', a.cookies);
    expect(res.body.items).toHaveLength(0);
  });

  it('валидация: from >= to → 400', async () => {
    const a = await prepareCustomerWithBackfilledSub('a5@e.com');
    const t = new Date().toISOString();
    const res = await http
      .get(`${PFX}/billing-history?from=${t}&to=${t}`)
      .set('Cookie', a.cookies);
    expect(res.status).toBe(400);
  });

  it('без auth → 401', async () => {
    const from = new Date(Date.now() - 1000).toISOString();
    const to = new Date().toISOString();
    const res = await http.get(`${PFX}/billing-history?from=${from}&to=${to}`);
    expect(res.status).toBe(401);
  });
});
