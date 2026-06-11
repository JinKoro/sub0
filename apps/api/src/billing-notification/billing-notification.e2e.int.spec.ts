import type { INestApplication } from '@nestjs/common';
import {
  BillingPeriod,
  Currency,
  NotificationChannelType,
  NotificationEvent,
} from '@subzero/shared';
import request from 'supertest';

import { BillingNotificationService } from './billing-notification.service';
import { closeTestPool, createTestDb, dropTestDb, testPool, truncateAll } from '../test-utils/db';
import { createTestApp, type SentTelegram } from '../test-utils/app';
import { seedCustomer } from '../test-utils/seed';
import { TelegramOutboxWorker } from '../telegram/telegram-outbox.worker';

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
  let tgWorker: TelegramOutboxWorker;
  let sentTelegram: SentTelegram[];

  beforeAll(async () => {
    await createTestDb();
    const t = await createTestApp();
    app = t.app;
    http = request(app.getHttpServer());
    svc = app.get(BillingNotificationService);
    tgWorker = app.get(TelegramOutboxWorker);
    sentTelegram = t.sentTelegram;
  });

  afterAll(async () => {
    await app.close();
    await closeTestPool();
    await dropTestDb();
  });

  beforeEach(async () => {
    await truncateAll();
    sentTelegram.length = 0;
  });

  async function createSubInDays({
    email,
    daysAhead,
  }: {
    email: string;
    daysAhead: number;
  }): Promise<{ cookies: string; subSku: string }> {
    await seedCustomer({ email, password: 'Passw0rd1' });
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

  async function tgOutboxCountFor(chatId: string): Promise<number> {
    const { rows } = await testPool().query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM telegram_outbox
       WHERE chat_id = $1 AND template = 'upcoming-charge'`,
      [chatId],
    );
    return rows[0].n;
  }

  async function customerIdByEmail(email: string): Promise<string> {
    const { rows } = await testPool().query<{ id: string }>(
      'SELECT id FROM customer WHERE email = $1',
      [email],
    );
    return rows[0].id;
  }

  /** Заводит verified TG-канал напрямую (как делает webhook #110 после
   *  /start), чтобы выборка кандидатов его подхватила. */
  async function verifyTelegram(customerId: string, chatId: string): Promise<void> {
    await testPool().query(
      `INSERT INTO notification_channel (customer_id, type_id, address, verified_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (customer_id, type_id)
       DO UPDATE SET address = excluded.address, verified_at = now()`,
      [customerId, NotificationChannelType.TELEGRAM, chatId],
    );
  }

  async function setUpcomingChannels(cookies: string, channelTypeIds: number[]): Promise<void> {
    const r = await http
      .post(`${PFX}/customers/me/notifications/preferences`)
      .set('Cookie', cookies)
      .send({ items: [{ eventId: NotificationEvent.UPCOMING_CHARGE, channelTypeIds }] });
    expect(r.status).toBe(200);
  }

  it('cron шлёт письмо по дефолту (3 дня до списания) и не дублирует при повторе', async () => {
    // Без явных preferences customer должен получать дефолтное письмо
    // за 3 дня — это покрывает кейс «юзер ничего не настраивал».
    await createSubInDays({ email: 'a@e.com', daysAhead: 3 });

    const res1 = await svc.runDailyTick();
    expect(res1.candidates).toBe(1);
    expect(await outboxCountFor('a@e.com')).toBe(1);

    // Идемпотентность: повторный запуск → ON CONFLICT DO NOTHING.
    await svc.runDailyTick();
    expect(await outboxCountFor('a@e.com')).toBe(1);
  });

  it('TELEGRAM в channel_type_ids + verified TG → строка в telegram_outbox, доставка воркером', async () => {
    const { cookies } = await createSubInDays({ email: 'tg1@e.com', daysAhead: 3 });
    const id = await customerIdByEmail('tg1@e.com');
    await verifyTelegram(id, '555001');
    // Только TG (без EMAIL) — проверяем, что фан-аут идёт по выбору юзера.
    await setUpcomingChannels(cookies, [NotificationChannelType.TELEGRAM]);

    const res = await svc.runDailyTick();
    expect(res.candidates).toBe(1);
    expect(await tgOutboxCountFor('555001')).toBe(1);
    expect(await outboxCountFor('tg1@e.com')).toBe(0);

    // Воркер доставляет сообщение через (fake) Bot API.
    await tgWorker.tick();
    expect(sentTelegram).toHaveLength(1);
    expect(sentTelegram[0]).toMatchObject({ chatId: '555001' });
    expect(sentTelegram[0].text).toContain('Sub tg1@e.com');

    // Идемпотентность: повторный tick планировщика не плодит дубль.
    await svc.runDailyTick();
    expect(await tgOutboxCountFor('555001')).toBe(1);
  });

  it('оба канала (EMAIL+TELEGRAM) → фан-аут в оба outbox', async () => {
    const { cookies } = await createSubInDays({ email: 'tg2@e.com', daysAhead: 3 });
    const id = await customerIdByEmail('tg2@e.com');
    await verifyTelegram(id, '555002');
    await setUpcomingChannels(cookies, [
      NotificationChannelType.EMAIL,
      NotificationChannelType.TELEGRAM,
    ]);

    const res = await svc.runDailyTick();
    expect(res.candidates).toBe(2); // один и тот же event на два канала
    expect(await outboxCountFor('tg2@e.com')).toBe(1);
    expect(await tgOutboxCountFor('555002')).toBe(1);
  });

  it('TELEGRAM выбран, но канал НЕ verified → в TG не шлём', async () => {
    const { cookies } = await createSubInDays({ email: 'tg3@e.com', daysAhead: 3 });
    // verified TG не заводим — только connect (unverified) сделал бы то же.
    await setUpcomingChannels(cookies, [NotificationChannelType.TELEGRAM]);

    await svc.runDailyTick();
    expect(await tgOutboxCountFor('any')).toBe(0);
    const { rows } = await testPool().query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM telegram_outbox`,
    );
    expect(rows[0].n).toBe(0);
  });

  it('подписка не попадает если daysUntil ∉ дефолтных lead_days', async () => {
    await createSubInDays({ email: 'b@e.com', daysAhead: 5 });
    await svc.runDailyTick();
    expect(await outboxCountFor('b@e.com')).toBe(0);
  });

  it('preference UPCOMING_CHARGE.enabled=false → ничего не отправляется', async () => {
    const { cookies } = await createSubInDays({ email: 'c@e.com', daysAhead: 3 });
    const r = await http
      .post(`${PFX}/customers/me/notifications/preferences`)
      .set('Cookie', cookies)
      .send({
        items: [
          {
            eventId: NotificationEvent.UPCOMING_CHARGE,
            enabled: false,
            channelTypeIds: [NotificationChannelType.EMAIL],
            daysBefore: [3],
          },
        ],
      });
    expect(r.status).toBe(200);

    await svc.runDailyTick();
    expect(await outboxCountFor('c@e.com')).toBe(0);
  });

  it('подписка PAUSED не триггерит', async () => {
    const { cookies, subSku } = await createSubInDays({
      email: 'd@e.com',
      daysAhead: 3,
    });
    const sub = await http.get(`${PFX}/subscriptions/${subSku}`).set('Cookie', cookies);
    await http
      .post(`${PFX}/subscriptions/${subSku}`)
      .set('Cookie', cookies)
      .send({ stateId: 2, version: sub.body.version }); // SubscriptionState.PAUSED

    await svc.runDailyTick();
    expect(await outboxCountFor('d@e.com')).toBe(0);
  });

  it('preference daysBefore=[1] → шлём за 1 день, не за 3', async () => {
    const { cookies } = await createSubInDays({ email: 'g@e.com', daysAhead: 3 });
    await http
      .post(`${PFX}/customers/me/notifications/preferences`)
      .set('Cookie', cookies)
      .send({
        items: [
          {
            eventId: NotificationEvent.UPCOMING_CHARGE,
            daysBefore: [1],
          },
        ],
      });

    await svc.runDailyTick();
    // daysUntil=3, preference=[1] → не попадаем.
    expect(await outboxCountFor('g@e.com')).toBe(0);
  });

  it('GET /customers/me/notifications отдаёт дефолты до первого PATCH', async () => {
    await seedCustomer({ email: 'h@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'h@e.com', 'Passw0rd1');

    const r = await http.get(`${PFX}/customers/me/notifications`).set('Cookie', cookies);
    expect(r.status).toBe(200);
    const upcoming = r.body.preferences.find(
      (p: { eventId: number }) => p.eventId === NotificationEvent.UPCOMING_CHARGE,
    );
    expect(upcoming).toEqual({
      eventId: NotificationEvent.UPCOMING_CHARGE,
      enabled: true,
      channelTypeIds: [NotificationChannelType.EMAIL],
      daysBefore: [3],
    });
    // Все 5 событий присутствуют (дефолты для не-UPCOMING_CHARGE — disabled).
    expect(r.body.preferences).toHaveLength(5);
    expect(r.body.quietHours).toEqual({ enabled: false, from: null, to: null });
  });

  it('POST /customers/me/quiet-hours: 400 без from/to при enabled=true', async () => {
    await seedCustomer({ email: 'i@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'i@e.com', 'Passw0rd1');
    const me = await http.get(`${PFX}/customers/me`).set('Cookie', cookies);

    const bad = await http
      .post(`${PFX}/customers/me/quiet-hours`)
      .set('Cookie', cookies)
      .send({ enabled: true, version: me.body.version });
    expect(bad.status).toBe(400);
  });

  it('POST /customers/me/quiet-hours сохраняет окно', async () => {
    await seedCustomer({ email: 'j@e.com', password: 'Passw0rd1' });
    const cookies = await login(http, 'j@e.com', 'Passw0rd1');
    const me = await http.get(`${PFX}/customers/me`).set('Cookie', cookies);

    const r = await http
      .post(`${PFX}/customers/me/quiet-hours`)
      .set('Cookie', cookies)
      .send({ enabled: true, from: '22:00', to: '09:00', version: me.body.version });
    expect(r.status).toBe(200);
    expect(r.body.enabled).toBe(true);
    expect(r.body.from).toBe('22:00');
    expect(r.body.to).toBe('09:00');
  });
});
